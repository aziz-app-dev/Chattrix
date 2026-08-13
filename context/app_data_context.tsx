import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { CallProps } from "@/constants/types";
import { useAuth } from "./auth_context";
import { getCallHistory } from "@/services/call_service";
import {
  cacheKeys,
  loadCache,
  saveCache,
} from "@/services/offline_cache";
import {
  getConversations,
  getMessages,
} from "@/services/conversation_service";

interface Conversation {
  _id: string;
  type: "direct" | "group";
  [key: string]: any;
}

interface AppDataContextProps {
  directConversations: Conversation[];
  groupConversations: Conversation[];
  messagesMap: Record<string, any[]>;
  callHistory: CallProps[];
  isInitialLoading: boolean;
  isRefreshing: boolean;
  refreshAll: () => Promise<boolean>;
  upsertConversation: (conversation: Conversation) => void;
  seedMessages: (conversationId: string, messages: any[]) => void;
}

const AppDataContext = createContext<AppDataContextProps>({
  directConversations: [],
  groupConversations: [],
  messagesMap: {},
  callHistory: [],
  isInitialLoading: true,
  isRefreshing: false,
  refreshAll: async () => false,
  upsertConversation: () => {},
  seedMessages: () => {},
});

export const AppDataProvider = ({ children }: { children: ReactNode }) => {
  const { token, isAuthenticated } = useAuth();

  const [directConversations, setDirectConversations] = useState<
    Conversation[]
  >([]);
  const [groupConversations, setGroupConversations] = useState<Conversation[]>(
    []
  );
  const [messagesMap, setMessagesMap] = useState<Record<string, any[]>>({});
  const [callHistory, setCallHistory] = useState<CallProps[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshingRef = useRef(false);

  // Refresh everything from the API and persist to cache
  const refreshAll = useCallback(async (): Promise<boolean> => {
    if (!token || refreshingRef.current) return false;
    refreshingRef.current = true;
    setIsRefreshing(true);

    try {
      const [directResult, groupResult, callsResult] = await Promise.allSettled([
        getConversations(token, "direct"),
        getConversations(token, "group"),
        getCallHistory(token, 1, 50),
      ]);

      let refreshedAny = false;

      if (directResult.status === "fulfilled") {
        const data = directResult.value as Conversation[];
        setDirectConversations(data);
        saveCache(cacheKeys.conversations("direct"), data);
        refreshedAny = true;
      }
      if (groupResult.status === "fulfilled") {
        const data = groupResult.value as Conversation[];
        setGroupConversations(data);
        saveCache(cacheKeys.conversations("group"), data);
        refreshedAny = true;
      }
      if (callsResult.status === "fulfilled") {
        const data = callsResult.value.data as CallProps[];
        setCallHistory(data);
        saveCache(cacheKeys.calls(), data);
        refreshedAny = true;
      }

      // Refresh messages for every known conversation (best effort)
      const allConversations = [
        ...(directResult.status === "fulfilled"
          ? directResult.value
          : directConversations),
        ...(groupResult.status === "fulfilled"
          ? groupResult.value
          : groupConversations),
      ];
      const results = await Promise.allSettled(
        allConversations.map((conv) =>
          getMessages(token, conv._id).then((msgs) => ({ convId: conv._id, msgs }))
        )
      );
      setMessagesMap((prev) => {
        const next = { ...prev };
        results.forEach((res) => {
          if (res.status === "fulfilled") {
            next[res.value.convId] = res.value.msgs;
            saveCache(cacheKeys.messages(res.value.convId), res.value.msgs);
            refreshedAny = true;
          }
        });
        return next;
      });

      return refreshedAny;
    } catch (error) {
      console.log("AppData refresh error:", error);
      return false;
    } finally {
      refreshingRef.current = false;
      setIsRefreshing(false);
    }
  }, [token, directConversations, groupConversations]);

  // On app start (authenticated): show cached data immediately, then refresh
  // from the API in the background.
  useEffect(() => {
    if (!isAuthenticated) {
      setIsInitialLoading(false);
      return;
    }
    if (!token) return;

    let cancelled = false;

    (async () => {
      try {
        // 1) Serve cached data first (instant UI)
        const [cDirect, cGroup, cCalls] = await Promise.all([
          loadCache<Conversation[]>(cacheKeys.conversations("direct")),
          loadCache<Conversation[]>(cacheKeys.conversations("group")),
          loadCache<CallProps[]>(cacheKeys.calls()),
        ]);
        if (cancelled) return;

        const direct = cDirect ?? [];
        const group = cGroup ?? [];

        setDirectConversations(direct);
        setGroupConversations(group);
        setCallHistory(cCalls ?? []);

        // Load cached messages for each cached conversation
        const map: Record<string, any[]> = {};
        const conversationIds = [...direct, ...group].map((c) => c._id);
        const messageResults = await Promise.allSettled(
          conversationIds.map((id) => loadCache<any[]>(cacheKeys.messages(id)))
        );
        conversationIds.forEach((id, i) => {
          const res = messageResults[i];
          if (res.status === "fulfilled" && res.value) {
            map[id] = res.value;
          }
        });
        if (cancelled) return;
        setMessagesMap(map);

        setIsInitialLoading(false);

        // 2) Background refresh from the API
        refreshAll();
      } catch (error) {
        console.log("AppData initial load error:", error);
        if (!cancelled) setIsInitialLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, token]);

  const upsertConversation = useCallback(
    (conversation: Conversation) => {
      if (conversation.type === "group") {
        setGroupConversations((prev) => {
          const next = [
            conversation,
            ...prev.filter((c) => c._id !== conversation._id),
          ];
          saveCache(cacheKeys.conversations("group"), next);
          return next;
        });
      } else {
        setDirectConversations((prev) => {
          const next = [
            conversation,
            ...prev.filter((c) => c._id !== conversation._id),
          ];
          saveCache(cacheKeys.conversations("direct"), next);
          return next;
        });
      }
    },
    []
  );

  const seedMessages = useCallback((conversationId: string, messages: any[]) => {
    setMessagesMap((prev) => {
      const next = { ...prev, [conversationId]: messages };
      saveCache(cacheKeys.messages(conversationId), messages);
      return next;
    });
  }, []);

  return (
    <AppDataContext.Provider
      value={{
        directConversations,
        groupConversations,
        messagesMap,
        callHistory,
        isInitialLoading,
        isRefreshing,
        refreshAll,
        upsertConversation,
        seedMessages,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = () => useContext(AppDataContext);

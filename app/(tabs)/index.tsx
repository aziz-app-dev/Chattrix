import ConversationListItem from "@/components/conversation_list_item";
import MyTxt from "@/components/txt_conponents";
import { colors } from "@/constants/theme";
import { useAuth } from "@/context/auth_context";
import { useSocket } from "@/context/socket_context";
import { getConversations } from "@/services/conversation_service";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ImageBackground,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

type TabType = "messages" | "groups";

export default function HomeScreen() {
  const { user: curentUser, token } = useAuth();
  const { onNewMessage, offNewMessage } = useSocket();
  const [activeTab, setActiveTab] = useState<TabType>("messages");
  const [conversations, setConversations] = useState<any[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Cache for both tabs - persists across tab switches
  const cacheRef = useRef<{ direct: any[]; group: any[]; loadedDirect: boolean; loadedGroup: boolean }>({
    direct: [],
    group: [],
    loadedDirect: false,
    loadedGroup: false,
  });

  const fetchConversations = useCallback(async (type: "direct" | "group", showLoading = false) => {
    if (!token) return;

    const cacheKey = type;
    const loadedKey = type === "direct" ? "loadedDirect" : "loadedGroup";

    // Show loading only if no cache exists
    if (showLoading && !cacheRef.current[loadedKey]) {
      setIsInitialLoading(true);
    }

    try {
      const data = await getConversations(token, type);
      // Update cache
      cacheRef.current[cacheKey] = data;
      cacheRef.current[loadedKey] = true;

      // Update UI if still on the same tab
      const currentType = activeTab === "messages" ? "direct" : "group";
      if (currentType === type) {
        setConversations(data);
      }
    } catch (error) {
      console.log("Error fetching conversations:", error);
    } finally {
      setIsInitialLoading(false);
      setIsRefreshing(false);
    }
  }, [token, activeTab]);

  // Initial load on focus - fetch current tab data
  useFocusEffect(
    useCallback(() => {
      const type = activeTab === "messages" ? "direct" : "group";
      const loadedKey = type === "direct" ? "loadedDirect" : "loadedGroup";

      // Show cached data immediately if available
      if (cacheRef.current[loadedKey]) {
        setConversations(cacheRef.current[type]);
        setIsInitialLoading(false);
      }

      // Fetch fresh data (in background if cache exists)
      fetchConversations(type, !cacheRef.current[loadedKey]);
    }, [activeTab, fetchConversations])
  );

  // Instant tab switch using cache
  useEffect(() => {
    const type = activeTab === "messages" ? "direct" : "group";
    const loadedKey = type === "direct" ? "loadedDirect" : "loadedGroup";

    // Immediately show cached data
    if (cacheRef.current[loadedKey]) {
      setConversations(cacheRef.current[type]);
      setIsInitialLoading(false);
    } else {
      // No cache - need to fetch
      setConversations([]);
      fetchConversations(type, true);
    }
  }, [activeTab, fetchConversations]);

  // Listen for new messages to update both cache AND current view in real-time
  useEffect(() => {
    const handleNewMessage = (data: any) => {
      if (!data.conversation) return;

      const conversationType = data.conversation.type as "direct" | "group";
      const currentType = activeTab === "messages" ? "direct" : "group";

      // Always update the cache for the conversation's type
      const updateCache = (type: "direct" | "group") => {
        const cache = cacheRef.current[type];
        const filtered = cache.filter((conv) => conv._id !== data.conversation._id);
        cacheRef.current[type] = [data.conversation, ...filtered];
      };

      updateCache(conversationType);

      // Update UI if viewing the affected tab
      if (conversationType === currentType) {
        setConversations([...cacheRef.current[currentType]]);
      }
    };

    onNewMessage(handleNewMessage);

    return () => {
      offNewMessage();
    };
  }, [onNewMessage, offNewMessage, activeTab]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    const type = activeTab === "messages" ? "direct" : "group";
    fetchConversations(type, false);
  };

  const handleNewChat = () => {
    if (activeTab === "messages") {
      router.push("/(modal)/users_list_modal");
    } else {
      router.push("/(modal)/create_group_modal");
    }
  };

  return (
    <ImageBackground
      style={{ flex: 1 }}
      source={require("../../assets/images/bgPattern.png")}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <MyTxt color={colors.white} fontSize={17}>
          Welcome Back, {""}{" "}
          <MyTxt color={colors.white} fontSize={18} fontWeight={"bold"}>
            {curentUser?.name}
          </MyTxt>
        </MyTxt>
        <View style={styles.settingsIcon}>
          <TouchableOpacity
            onPress={() => router.push("/(modal)/profile_modal")}
          >
            <Ionicons name="settings" size={18} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* CONTENT */}
      <View style={styles.content}>
        {/* TABS */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "messages" && styles.activeTab,
            ]}
            onPress={() => setActiveTab("messages")}
          >
            <MyTxt
              fontSize={15}
              fontWeight="600"
              color={activeTab === "messages" ? colors.white : colors.neutral600}
            >
              Messages
            </MyTxt>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "groups" && styles.activeTab,
            ]}
            onPress={() => setActiveTab("groups")}
          >
            <MyTxt
              fontSize={15}
              fontWeight="600"
              color={activeTab === "groups" ? colors.white : colors.neutral600}
            >
              Groups
            </MyTxt>
          </TouchableOpacity>
        </View>

        {/* CONVERSATION LIST */}
        {isInitialLoading && conversations.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <ConversationListItem conversation={item} />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                colors={[colors.primary]}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons
                  name={activeTab === "messages" ? "chatbubbles-outline" : "people-outline"}
                  size={60}
                  color={colors.neutral300}
                />
                <MyTxt
                  fontSize={16}
                  color={colors.neutral400}
                  style={{ marginTop: 10 }}
                >
                  {activeTab === "messages"
                    ? "No messages yet"
                    : "No groups yet"}
                </MyTxt>
                <MyTxt fontSize={14} color={colors.neutral400}>
                  Tap + to start a new{" "}
                  {activeTab === "messages" ? "conversation" : "group"}
                </MyTxt>
              </View>
            }
          />
        )}

        {/* FLOATING BUTTON */}
        <TouchableOpacity style={styles.floatingBtn} onPress={handleNewChat}>
          <Ionicons name="add" size={28} color={colors.white} />
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 25,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  content: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    borderCurve: "continuous",
    paddingHorizontal: 20,
    paddingTop: 20,
    marginTop: 5,
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: colors.neutral100,
    borderRadius: 25,
    padding: 4,
    marginBottom: 15,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 80,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  settingsIcon: {
    padding: 10,
    backgroundColor: colors.neutral700,
    borderRadius: 100,
  },
  floatingBtn: {
    position: "absolute",
    bottom: 20,
    right: 20,
    height: 56,
    width: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});

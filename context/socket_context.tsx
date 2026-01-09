import { SocketContextProps } from "@/constants/types";
import { socketService } from "@/services/socket_service";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useAuth } from "./auth_context";

const SocketContext = createContext<SocketContextProps>({
  isConnected: false,
  onlineUsers: [],
  connect: () => {},
  disconnect: () => {},
  joinRoom: () => {},
  leaveRoom: () => {},
  sendMessage: () => {},
  sendDirectMessage: () => {},
  sendTypingStatus: () => {},
  sendReadReceipt: () => {},
  emitProfileUpdate: () => {},
  onMessage: () => {},
  onDirectMessage: () => {},
  onNewMessage: () => {},
  onTyping: () => {},
  onUserOnline: () => {},
  onUserOffline: () => {},
  offMessage: () => {},
  offDirectMessage: () => {},
  offNewMessage: () => {},
  offTyping: () => {},
});

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { token } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  // Connect when token is available
  useEffect(() => {
    if (token) {
      console.log("🔌 Socket: Token available, attempting to connect...");
      const socket = socketService.connect(token);

      socket.on("connect", () => {
        console.log("🔌 Socket: Connected successfully! Socket ID:", socket.id);
        setIsConnected(true);
        // Fetch online users on connect
        socketService.getOnlineUsers((users) => {
          console.log("🔌 Socket: Online users fetched:", users);
          setOnlineUsers(users);
        });
      });

      socket.on("connect_error", (error) => {
        console.log("🔌 Socket: Connection error:", error.message);
      });

      socket.on("disconnect", (reason) => {
        console.log("🔌 Socket: Disconnected, reason:", reason);
        setIsConnected(false);
      });

      // Track online users
      socketService.onUserOnline(({ userId }) => {
        console.log("🔌 Socket: User came online:", userId);
        setOnlineUsers((prev) => {
          if (!prev.includes(userId)) {
            return [...prev, userId];
          }
          return prev;
        });
      });

      socketService.onUserOffline(({ userId }) => {
        console.log("🔌 Socket: User went offline:", userId);
        setOnlineUsers((prev) => prev.filter((id) => id !== userId));
      });

      return () => {
        console.log("🔌 Socket: Cleaning up connection...");
        socketService.disconnect();
        setIsConnected(false);
        setOnlineUsers([]);
      };
    } else {
      console.log("🔌 Socket: No token available, not connecting");
    }
  }, [token]);

  const connect = useCallback(() => {
    if (token) {
      socketService.connect(token);
    }
  }, [token]);

  const disconnect = useCallback(() => {
    socketService.disconnect();
    setIsConnected(false);
    setOnlineUsers([]);
  }, []);

  const joinRoom = useCallback((roomId: string) => {
    socketService.joinRoom(roomId);
  }, []);

  const leaveRoom = useCallback((roomId: string) => {
    socketService.leaveRoom(roomId);
  }, []);

  const sendMessage = useCallback(
    (roomId: string, message: string, type?: string) => {
      socketService.sendMessage(roomId, message, type);
    },
    []
  );

  const sendDirectMessage = useCallback(
    (recipientId: string, message: string, type?: string) => {
      socketService.sendDirectMessage(recipientId, message, type);
    },
    []
  );

  const sendTypingStatus = useCallback(
    (roomId: string, isTyping: boolean) => {
      socketService.sendTypingStatus(roomId, isTyping);
    },
    []
  );

  const sendReadReceipt = useCallback(
    (roomId: string, messageIds: string[]) => {
      socketService.sendReadReceipt(roomId, messageIds);
    },
    []
  );

  const emitProfileUpdate = useCallback(
    (userId: string, avatar: string) => {
      socketService.emitProfileUpdate(userId, avatar);
    },
    []
  );

  const onMessage = useCallback((callback: (data: any) => void) => {
    socketService.onMessage(callback);
  }, []);

  const onDirectMessage = useCallback((callback: (data: any) => void) => {
    socketService.onDirectMessage(callback);
  }, []);

  const onNewMessage = useCallback((callback: (data: any) => void) => {
    socketService.onNewMessage(callback);
  }, []);

  const onTyping = useCallback((callback: (data: any) => void) => {
    socketService.onTyping(callback);
  }, []);

  const onUserOnline = useCallback(
    (callback: (data: { userId: string }) => void) => {
      socketService.onUserOnline(callback);
    },
    []
  );

  const onUserOffline = useCallback(
    (callback: (data: { userId: string }) => void) => {
      socketService.onUserOffline(callback);
    },
    []
  );

  const offMessage = useCallback(() => {
    socketService.offMessage();
  }, []);

  const offDirectMessage = useCallback(() => {
    socketService.offDirectMessage();
  }, []);

  const offNewMessage = useCallback(() => {
    socketService.offNewMessage();
  }, []);

  const offTyping = useCallback(() => {
    socketService.offTyping();
  }, []);

  return (
    <SocketContext.Provider
      value={{
        isConnected,
        onlineUsers,
        connect,
        disconnect,
        joinRoom,
        leaveRoom,
        sendMessage,
        sendDirectMessage,
        sendTypingStatus,
        sendReadReceipt,
        emitProfileUpdate,
        onMessage,
        onDirectMessage,
        onNewMessage,
        onTyping,
        onUserOnline,
        onUserOffline,
        offMessage,
        offDirectMessage,
        offNewMessage,
        offTyping,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);

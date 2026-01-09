import { colors } from "@/constants/theme";
import { useAuth } from "@/context/auth_context";
import { useSocket } from "@/context/socket_context";
import { router } from "expo-router";
import React from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import MyTxt from "./txt_conponents";

interface Participant {
  _id: string;
  name: string;
  email: string;
  img?: string;
}

interface LastMessage {
  content: string;
  createdAt: string;
  type: string;
}

interface ConversationListItemProps {
  conversation: {
    _id: string;
    type: "direct" | "group";
    name?: string;
    avatar?: string;
    participants: Participant[];
    lastMessage?: LastMessage;
    updatedAt: string;
  };
}

const ConversationListItem: React.FC<ConversationListItemProps> = ({
  conversation,
}) => {
  const { user } = useAuth();
  const { onlineUsers } = useSocket();

  // For direct conversations, get the other participant
  const otherParticipant =
    conversation.type === "direct"
      ? conversation.participants.find((p) => p._id !== user?.id)
      : null;

  const displayName =
    conversation.type === "group"
      ? conversation.name
      : otherParticipant?.name || "Unknown";

  const avatarUri =
    conversation.type === "group"
      ? conversation.avatar
      : otherParticipant?.img;

  const isOnline =
    conversation.type === "direct" &&
    otherParticipant &&
    onlineUsers.includes(otherParticipant._id);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  const getLastMessageText = () => {
    if (!conversation.lastMessage) return "No messages yet";
    if (conversation.lastMessage.type === "image") return "📷 Image";
    if (conversation.lastMessage.type === "file") return "📎 File";
    return conversation.lastMessage.content;
  };

  const handlePress = () => {
    // Get all participant IDs for calls
    const participantIds = conversation.participants.map((p) => p._id);

    router.push({
      pathname: "/chat_screen",
      params: {
        conversationId: conversation._id,
        name: displayName,
        avatar: avatarUri || "",
        type: conversation.type,
        participantIds: JSON.stringify(participantIds),
      },
    });
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <View style={styles.avatarContainer}>
        <Image
          source={
            avatarUri
              ? { uri: avatarUri }
              : require("@/assets/images/3d_profile.png")
          }
          style={styles.avatar}
        />
        {isOnline && <View style={styles.onlineIndicator} />}
      </View>

      <View style={styles.content}>
        <View style={styles.topRow}>
          <MyTxt fontSize={16} fontWeight="600" style={styles.name}>
            {displayName}
          </MyTxt>
          <MyTxt fontSize={12} color={colors.neutral500}>
            {formatTime(conversation.lastMessage?.createdAt || conversation.updatedAt)}
          </MyTxt>
        </View>

        <View style={styles.bottomRow}>
          <MyTxt
            fontSize={14}
            color={colors.neutral500}
            style={styles.lastMessage}
            numberOfLines={1}
          >
            {getLastMessageText()}
          </MyTxt>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default ConversationListItem;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral100,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 55,
    height: 55,
    borderRadius: 30,
    backgroundColor: colors.neutral200,
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.green,
    borderWidth: 2,
    borderColor: colors.white,
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  name: {
    flex: 1,
    marginRight: 8,
  },
  lastMessage: {
    flex: 1,
  },
});

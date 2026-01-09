import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, View } from "react-native";
import MyTxt from "./txt_conponents";

interface MessageBubbleProps {
  content: string;
  isMe: boolean;
  time: string;
  senderName?: string;
  senderImg?: string;
  showAvatar?: boolean;
  isGroup?: boolean;
  status?: "sending" | "sent" | "failed";
  type?: "text" | "image" | "file";
  attachment?: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  content,
  isMe,
  time,
  senderName,
  senderImg,
  showAvatar = false,
  isGroup = false,
  status,
  type = "text",
  attachment,
}) => {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <View
      style={[
        styles.messageContainer,
        isMe ? styles.myMessage : styles.otherMessage,
      ]}
    >
      {!isMe && isGroup && showAvatar && (
        <Image
          source={
            senderImg
              ? { uri: senderImg }
              : require("@/assets/images/3d_profile.png")
          }
          style={styles.messageAvatar}
        />
      )}
      <View
        style={[
          styles.messageBubble,
          isMe ? styles.myBubble : styles.otherBubble,
          !isMe && isGroup && !showAvatar && styles.bubbleWithoutAvatar,
        ]}
      >
        {!isMe && isGroup && showAvatar && senderName && (
          <MyTxt fontSize={12} color={colors.neutral900} fontWeight="600">
            {senderName}
          </MyTxt>
        )}
        {type === "image" && attachment ? (
          <Image
            source={{ uri: attachment }}
            style={styles.messageImage}
            resizeMode="cover"
          />
        ) : (
          <MyTxt fontSize={15} color={colors.black}>
            {content}
          </MyTxt>
        )}
        <View style={styles.messageFooter}>
          <MyTxt fontSize={10} color={colors.black}>
            {formatTime(time)}
          </MyTxt>
          {isMe && status && (
            <Ionicons
              name={
                status === "sending"
                  ? "time-outline"
                  : status === "sent"
                  ? "checkmark-done"
                  : "alert-circle-outline"
              }
              size={14}
              color={status === "failed" ? colors.rose : colors.neutral400}
              style={{ marginLeft: 4 }}
            />
          )}
        </View>
      </View>
    </View>
  );
};

export default MessageBubble;

const styles = StyleSheet.create({
  messageContainer: {
    flexDirection: "row",
    marginVertical: 5,
    alignItems: "flex-end",
  },
  myMessage: {
    justifyContent: "flex-end",
  },
  otherMessage: {
    justifyContent: "flex-start",
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: "75%",
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 14,
  },
  myBubble: {
    backgroundColor: colors.myBubble,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor:  colors.otherBubble,
    borderBottomLeftRadius: 4,
  },
  bubbleWithoutAvatar: {
    marginLeft: 36,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginVertical: 4,
  },
  messageFooter: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    // marginTop: 1,
    paddingLeft:20
  },
});

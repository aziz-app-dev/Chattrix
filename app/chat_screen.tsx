import BackBtn from "@/components/back_btn_component";
import MessageBubble from "@/components/message_bubble";
import MyTxt from "@/components/txt_conponents";
import { colors } from "@/constants/theme";
import { useAuth } from "@/context/auth_context";
import { useCall } from "@/context/call_context";
import { useSocket } from "@/context/socket_context";
import { uploadImageToCloudinary } from "@/services/cloundinary_services";
import { getMessages, sendMessage } from "@/services/conversation_service";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Message {
  _id: string;
  content: string;
  type: "text" | "image" | "file";
  sender: {
    _id: string;
    name: string;
    img?: string;
  };
  createdAt: string;
  attachment?: string;
}

const ChatScreen = () => {
  const { conversationId, name, avatar, type, participantIds } = useLocalSearchParams<{
    conversationId: string;
    name: string;
    avatar: string;
    type: string;
    participantIds: string;
  }>();

  const { token, user } = useAuth();
  const { initiateCall } = useCall();
  const {
    onMessage,
    offMessage,
    onDirectMessage,
    offDirectMessage,
    joinRoom,
    leaveRoom,
  } = useSocket();

  // Parse participant IDs for calls
  const getParticipantIdsForCall = (): string[] => {
    if (participantIds) {
      try {
        const ids = JSON.parse(participantIds);
        return ids.filter((id: string) => id !== user?.id);
      } catch {
        return participantIds.split(",").filter((id) => id !== user?.id);
      }
    }
    return [];
  };

  const handleAudioCall = () => {
    const ids = getParticipantIdsForCall();
    if (ids.length > 0) {
      initiateCall(ids, "audio", conversationId);
    }
  };

  const handleVideoCall = () => {
    const ids = getParticipantIdsForCall();
    if (ids.length > 0) {
      initiateCall(ids, "video", conversationId);
    }
  };
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const fetchMessages = useCallback(async () => {
    if (!token || !conversationId) return;
    try {
      const data = await getMessages(token, conversationId);
      setMessages(data);
    } catch (error) {
      console.log("Error fetching messages:", error);
    } finally {
      setIsLoading(false);
    }
  }, [token, conversationId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Keyboard listeners
  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSubscription = Keyboard.addListener(showEvent, () => {
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // Join room when entering chat, leave when exiting
  useEffect(() => {
    if (conversationId) {
      joinRoom(conversationId);
    }
    return () => {
      if (conversationId) {
        leaveRoom(conversationId);
      }
    };
  }, [conversationId, joinRoom, leaveRoom]);

  useEffect(() => {
    // Listen for new messages
    const handleNewMessage = (data: any) => {
      if (data.conversationId === conversationId) {
        // Skip messages sent by current user - they're handled via optimistic update
        if (data.senderId === user?.id) return;

        const messageId = data.id || data._id;
        const newMessage: Message = {
          _id: messageId || Date.now().toString(),
          content: data.message || data.content,
          type: data.type || "text",
          sender: {
            _id: data.senderId,
            name: data.senderName || "",
            img: data.senderImg,
          },
          createdAt: data.timestamp || new Date().toISOString(),
          attachment: data.attachment,
        };
        // Prevent duplicates - check if message already exists
        setMessages((prev) => {
          const exists = prev.some((msg) => msg._id === newMessage._id);
          if (exists) return prev;
          return [...prev, newMessage];
        });
      }
    };

    onMessage(handleNewMessage);
    onDirectMessage(handleNewMessage);

    return () => {
      offMessage();
      offDirectMessage();
    };
  }, [
    conversationId,
    user?.id,
    onMessage,
    offMessage,
    onDirectMessage,
    offDirectMessage,
  ]);

  const handleSend = async () => {
    if (!inputText.trim() || !token || !conversationId || isSending) return;

    const messageText = inputText.trim();
    setInputText("");
    setIsSending(true);

    // Optimistic update
    const tempMessage: Message = {
      _id: `temp-${Date.now()}`,
      content: messageText,
      type: "text",
      sender: {
        _id: user?.id || "",
        name: user?.name || "",
        img: user?.avatar || undefined,
      },
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMessage]);

    try {
      const sentMessage = await sendMessage(token, conversationId, messageText);
      // Replace temp message with real one
      setMessages((prev) =>
        prev.map((msg) => (msg._id === tempMessage._id ? sentMessage : msg))
      );
    } catch (error) {
      console.log("Error sending message:", error);
      // Remove temp message on error
      setMessages((prev) => prev.filter((msg) => msg._id !== tempMessage._id));
      setInputText(messageText); // Restore input
    } finally {
      setIsSending(false);
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await handleImageUpload(result.assets[0].uri);
    }
  };

  const handleImageUpload = async (imageUri: string) => {
    if (!token || !conversationId || isUploading) return;

    setIsUploading(true);

    // Optimistic update with local image
    const tempMessage: Message = {
      _id: `temp-${Date.now()}`,
      content: "Sending image...",
      type: "image",
      sender: {
        _id: user?.id || "",
        name: user?.name || "",
        img: user?.avatar || undefined,
      },
      createdAt: new Date().toISOString(),
      attachment: imageUri,
    };
    setMessages((prev) => [...prev, tempMessage]);

    try {
      // Upload to Cloudinary
      const cloudinaryUrl = await uploadImageToCloudinary(imageUri);

      if (!cloudinaryUrl) {
        throw new Error("Failed to upload image");
      }

      // Send message with image URL
      const sentMessage = await sendMessage(
        token,
        conversationId,
        "Image",
        "image",
        cloudinaryUrl
      );

      // Replace temp message with real one
      setMessages((prev) =>
        prev.map((msg) => (msg._id === tempMessage._id ? sentMessage : msg))
      );
    } catch (error) {
      console.log("Error uploading image:", error);
      // Remove temp message on error
      setMessages((prev) => prev.filter((msg) => msg._id !== tempMessage._id));
    } finally {
      setIsUploading(false);
    }
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMe = item.sender._id === user?.id;
    const showAvatar =
      !isMe &&
      (index === 0 || messages[index - 1]?.sender._id !== item.sender._id);

    return (
      <MessageBubble
        content={item.content}
        isMe={isMe}
        time={item.createdAt}
        senderName={item.sender.name}
        senderImg={item.sender.img}
        showAvatar={showAvatar}
        isGroup={type === "group"}
        type={item.type}
        attachment={item.attachment}
      />
    );
  };

  return (
    <ImageBackground
      style={styles.container}
      source={require("@/assets/images/bgPattern.png")}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={keyboardVisible ? 40 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.innerContainer}>
            {/* HEADER */}
            <View style={styles.header}>
              <BackBtn />
              <Image
                source={
                  avatar
                    ? { uri: avatar }
                    : require("@/assets/images/3d_profile.png")
                }
                style={styles.headerAvatar}
              />

              <View style={styles.headerInfo}>
                <MyTxt color={colors.white} fontSize={16} fontWeight="600">
                  {name}
                </MyTxt>
                <View style={styles.onlineStatus}>
                  <View style={styles.onlineDot} />
                  <MyTxt fontSize={11} color={colors.neutral300}>
                    {type === "group" ? "Group Chat" : "Online"}
                  </MyTxt>
                </View>
              </View>

              <TouchableOpacity style={styles.headerBtn} onPress={handleAudioCall}>
                <Ionicons name="call-outline" size={20} color={colors.white} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerBtn} onPress={handleVideoCall}>
                <Ionicons name="videocam-outline" size={22} color={colors.white} />
              </TouchableOpacity>
            </View>

            {/* CONTENT */}
            <View style={styles.content}>
              {/* Messages */}
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              ) : (
                <FlatList
                  ref={flatListRef}
                  data={messages}
                  keyExtractor={(item, index) => `${item._id}-${index}`}
                  renderItem={renderMessage}
                  contentContainerStyle={styles.messagesList}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  onContentSizeChange={() =>
                    flatListRef.current?.scrollToEnd({ animated: true })
                  }
                  onLayout={() =>
                    flatListRef.current?.scrollToEnd({ animated: false })
                  }
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <View style={styles.emptyIconContainer}>
                        <Ionicons
                          name="chatbubble-ellipses-outline"
                          size={50}
                          color={colors.neutral400}
                        />
                      </View>
                      <MyTxt
                        fontSize={16}
                        fontWeight="600"
                        style={{ marginTop: 16 }}
                      >
                        No messages yet
                      </MyTxt>
                      <MyTxt
                        fontSize={14}
                        color={colors.neutral400}
                        style={{ marginTop: 8 }}
                      >
                        Say hello to start the conversation!
                      </MyTxt>
                    </View>
                  }
                />
              )}

              {/* Input */}
              <View
                style={[
                  styles.inputContainer,
                  { paddingBottom: Math.max(insets.bottom, 12) },
                ]}
              >
                <TouchableOpacity
                  style={styles.attachBtn}
                  onPress={pickImage}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Ionicons name="image" size={22} color={colors.primary} />
                  )}
                </TouchableOpacity>

                <TextInput
                  style={styles.input}
                  placeholder="Type a message..."
                  placeholderTextColor={colors.neutral400}
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                  maxLength={1000}
                />

                <TouchableOpacity
                  style={[
                    styles.sendBtn,
                    inputText.trim() ? styles.sendBtnActive : null,
                  ]}
                  onPress={handleSend}
                  disabled={!inputText.trim() || isSending}
                >
                  <FontAwesome
                    name="send"
                    size={18}
                    color={inputText.trim() ? colors.white : colors.neutral400}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: 8,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  onlineStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.green,
    marginRight: 6,
  },
  headerBtn: {
    padding: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    marginLeft: 6,
  },
  content: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop:10
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  messagesList: {
    paddingHorizontal: 15,
    paddingTop: 20,
    paddingBottom: 10,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.neutral100,
    justifyContent: "center",
    alignItems: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingTop: 10,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.neutral100,
  },
  attachBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.neutral100,
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    flex: 1,
    maxHeight: 110,
    marginHorizontal: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.neutral100,
    borderRadius: 22,
    fontSize: 15,
    color: colors.text,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.neutral100,
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnActive: {
    backgroundColor: colors.primary,
  },
});

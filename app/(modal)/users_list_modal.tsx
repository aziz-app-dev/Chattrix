import BackBtn from "@/components/back_btn_component";
import MyTxt from "@/components/txt_conponents";
import { colors } from "@/constants/theme";
import { useAuth } from "@/context/auth_context";
import { useSocket } from "@/context/socket_context";
import {
  createDirectConversation,
  getUsers,
} from "@/services/conversation_service";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface User {
  _id: string;
  name: string;
  email: string;
  img?: string;
}

const UsersListModal = () => {
  const { token } = useAuth();
  const { onlineUsers } = useSocket();
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const fetchUsers = useCallback(async () => {
    if (!token) return;
    try {
      const data = await getUsers(token, searchQuery);
      setUsers(data);
    } catch (error) {
      console.log("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  }, [token, searchQuery]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(debounce);
  }, [fetchUsers]);

  const handleUserPress = async (userId: string, userName: string, userImg?: string) => {
    if (!token || isCreating) return;
    setIsCreating(true);

    try {
      const conversation = await createDirectConversation(token, userId);
      router.replace({
        pathname: "/chat_screen",
        params: {
          conversationId: conversation._id,
          name: userName,
          avatar: userImg || "",
          type: "direct",
        },
      });
    } catch (error) {
      console.log("Error creating conversation:", error);
      setIsCreating(false);
    }
  };

  const renderUser = ({ item }: { item: User }) => {
    const isOnline = onlineUsers.includes(item._id);

    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => handleUserPress(item._id, item.name, item.img)}
        disabled={isCreating}
      >
        <View style={styles.avatarContainer}>
          <Image
            source={
              item.img
                ? { uri: item.img }
                : require("@/assets/images/3d_profile.png")
            }
            style={styles.avatar}
          />
          {isOnline && <View style={styles.onlineIndicator} />}
        </View>

        <View style={styles.userInfo}>
          <MyTxt fontSize={16} fontWeight="600">
            {item.name}
          </MyTxt>
          <MyTxt fontSize={13} color={colors.neutral500}>
            {item.email}
          </MyTxt>
        </View>

        <Ionicons name="chatbubble-outline" size={22} color={colors.primary} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <BackBtn onPress={() => router.back()} />
        <MyTxt fontSize={18} fontWeight="600">
          New Message
        </MyTxt>
        <View style={{ width: 40 }} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.neutral400} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          placeholderTextColor={colors.neutral400}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color={colors.neutral400} />
          </TouchableOpacity>
        )}
      </View>

      {/* Users List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item._id}
          renderItem={renderUser}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name="people-outline"
                size={50}
                color={colors.neutral300}
              />
              <MyTxt
                fontSize={15}
                color={colors.neutral400}
                style={{ marginTop: 10 }}
              >
                {searchQuery ? "No users found" : "No users available"}
              </MyTxt>
            </View>
          }
        />
      )}

      {isCreating && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </View>
  );
};

export default UsersListModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral100,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: colors.neutral100,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: colors.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral100,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.neutral200,
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.green,
    borderWidth: 2,
    borderColor: colors.white,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
});

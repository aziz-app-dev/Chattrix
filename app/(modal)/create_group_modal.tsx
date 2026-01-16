import BackBtn from "@/components/back_btn_component";
import MyBtn from "@/components/btn_component";
import MyInput from "@/components/input_component";
import MyTxt from "@/components/txt_conponents";
import { colors } from "@/constants/theme";
import { useAuth } from "@/context/auth_context";
import {
  createGroupConversation,
  getUsers,
} from "@/services/conversation_service";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ScrollView,
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

const CreateGroupModal = () => {
  const { token } = useAuth();
  const [groupName, setGroupName] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
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

  const toggleUserSelection = (user: User) => {
    setSelectedUsers((prev) => {
      const isSelected = prev.some((u) => u._id === user._id);
      if (isSelected) {
        return prev.filter((u) => u._id !== user._id);
      } else {
        return [...prev, user];
      }
    });
  };

  const removeSelectedUser = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u._id !== userId));
  };

  const handleCreateGroup = async () => {
    if (!token) return;

    if (!groupName.trim()) {
      Alert.alert("Error", "Please enter a group name");
      return;
    }

    if (selectedUsers.length < 1) {
      Alert.alert("Error", "Please select at least one member");
      return;
    }

    setIsCreating(true);

    try {
      const participantIds = selectedUsers.map((u) => u._id);
      const conversation = await createGroupConversation(
        token,
        groupName.trim(),
        participantIds
      );

      router.replace({
        pathname: "/chat_screen",
        params: {
          conversationId: conversation._id,
          name: conversation.name,
          avatar: conversation.avatar || "",
          type: "group",
        },
      });
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to create group");
      setIsCreating(false);
    }
  };

  const renderUser = ({ item }: { item: User }) => {
    const isSelected = selectedUsers.some((u) => u._id === item._id);

    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => toggleUserSelection(item)}
      >
        <Image
          source={
            item.img
              ? { uri: item.img }
              : require("@/assets/images/3d_profile.png")
          }
          style={styles.avatar}
        />

        <View style={styles.userInfo}>
          <MyTxt fontSize={15} fontWeight="600">
            {item.name}
          </MyTxt>
          <MyTxt fontSize={12} color={colors.neutral500}>
            {item.email}
          </MyTxt>
        </View>

        <View
          style={[
            styles.checkbox,
            isSelected && styles.checkboxSelected,
          ]}
        >
          {isSelected && (
            <Ionicons name="checkmark" size={16} color={colors.white} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <BackBtn onPress={() => router.back()} />
        <MyTxt fontSize={18} fontWeight="600">
          New Group
        </MyTxt>
        <View style={{ width: 40 }} />
      </View>

      {/* Group Name Input */}
      <View style={styles.groupNameContainer}>
        <View style={styles.groupIconContainer}>
          <Ionicons name="people" size={30} color={colors.neutral400} />
        </View>
        <MyInput
          placeholder="Group name"
          value={groupName}
          onChangeText={setGroupName}
          // containerStyle={styles.groupNameInput}
        />
      </View>

      {/* Selected Users */}
      {selectedUsers.length > 0 && (
        <View style={styles.selectedContainer}>
          <MyTxt fontSize={13} color={colors.neutral500} style={{ marginBottom: 8 }}>
            {selectedUsers.length} member{selectedUsers.length > 1 ? "s" : ""} selected
          </MyTxt>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {selectedUsers.map((user) => (
              <View key={user._id} style={styles.selectedUser}>
                <Image
                  source={
                    user.img
                      ? { uri: user.img }
                      : require("@/assets/images/3d_profile.png")
                  }
                  style={styles.selectedAvatar}
                />
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => removeSelectedUser(user._id)}
                >
                  <Ionicons name="close" size={12} color={colors.white} />
                </TouchableOpacity>
                <MyTxt fontSize={11} style={styles.selectedName} lineHeight={20}>
                  {user.name.split(" ")[0]}
                </MyTxt>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

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
              <MyTxt fontSize={15} color={colors.neutral400} style={{ marginTop: 10 }}>
                No users found
              </MyTxt>
            </View>
          }
        />
      )}

      {/* Create Button */}
      <View style={styles.footer}>
        <MyBtn
          onPress={handleCreateGroup}
          title="Create Group"
          loading={isCreating}
          disabled={!groupName.trim() || selectedUsers.length < 1}
        />
      </View>
    </View>
  );
};

export default CreateGroupModal;

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
  groupNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral100,
  },
  groupIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.neutral100,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  groupNameInput: {
    flex: 1,
    marginBottom: 0,
  },
  selectedContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral100,
  },
  selectedUser: {
    alignItems: "center",
    marginRight: 15,
    width: 60,
  },
  selectedAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.neutral200,
  },
  removeBtn: {
    position: "absolute",
    top: 0,
    right: 5,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.neutral500,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedName: {
    marginTop: 4,
    textAlign: "center",
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
    paddingBottom: 100,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral100,
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: colors.neutral200,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.neutral300,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.neutral100,
  },
});

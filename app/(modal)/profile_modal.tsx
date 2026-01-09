import BackBtn from "@/components/back_btn_component";
import MyBtn from "@/components/btn_component";
import MyInput from "@/components/input_component";
import ProfileImagePicker from "@/components/profile_image_picker";
import MyTxt from "@/components/txt_conponents";

import { colors } from "@/constants/theme";
import { UserDataProps } from "@/constants/types";
import { useAuth } from "@/context/auth_context";
import { useSocket } from "@/context/socket_context";
import { updateProfileName } from "@/services/profile_service";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";

import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";

const ProfileModal = () => {
  const { user: curentUser, token, signOut, updateToken } = useAuth();
  const { emitProfileUpdate } = useSocket();
  const [isLoading, setIsLoading] = useState(false);
  const [useData, setUseData] = useState<UserDataProps>({
    email: "",
    name: "",
    avatar: null,
  });

  useEffect(() => {
    setUseData({
      email: curentUser?.email ?? "",
      name: curentUser?.name ?? "",
      avatar: curentUser?.avatar ?? null,
    });
  }, [curentUser?.avatar, curentUser?.email, curentUser?.name]);

  const handleUpdateProfile = async () => {
    if (!token || !curentUser?.id) {
      Alert.alert("Error", "You must be logged in to update your profile.");
      return;
    }

    // Check if name has changed
    if (useData.name === curentUser?.name) {
      Alert.alert("Info", "No changes to update.");
      return;
    }

    if (!useData.name.trim()) {
      Alert.alert("Error", "Name cannot be empty.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await updateProfileName(token, useData.name.trim());

      if (response.token) {
        await updateToken(response.token);
      }

      // Emit socket event to notify other users
      emitProfileUpdate(curentUser.id, curentUser.avatar || "");

      Alert.alert("Success", "Profile updated successfully!");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update profile.");
    } finally {
      setIsLoading(false);
    }
  };

  const showLogputAlert = () => {
    Alert.alert("Confirm", "Are you sure you want to  logout", [
      {
        text: "Cancle",
        onPress: () => console.log("cancle"),
      },
      {
        text: "Done",
        onPress: () => signOut(),
      },
    ]);
  };
  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={() => router.back()} />
      <View style={styles.modalContainer}>
        {/* Header of modal */}
        <View style={styles.header}>
          <BackBtn onPress={() => router.back()} />
          <MyTxt fontSize={20} fontWeight={"600"}>
            {" "}
            Update Profile
          </MyTxt>
          <View />
        </View>
        <ScrollView>
          {/* Avatar of user */}
          <ProfileImagePicker
            currentImage={curentUser?.avatar ?? null}
            onImageUpdated={(newUrl) => {
              setUseData({ ...useData, avatar: newUrl });
            }}
          />
          {/* user data form */}
          <View style={styles.userDataContainer}>
            <MyTxt color={colors.neutral600} fontSize={15} fontWeight={"700"}>
              Name
            </MyTxt>
            <MyInput
              autoCapitalize="words"
              keyboardType="name-phone-pad"
              onChangeText={(val) => {
                setUseData({ ...useData, name: val });
              }}
              value={useData.name}
            />
            <MyTxt color={colors.neutral600} fontSize={15} fontWeight={"700"}>
              Email
            </MyTxt>
            <MyInput
              value={useData.email}
              onChangeText={() => {}}
              editable={false}
              textColor={colors.neutral400}
            />
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <TouchableOpacity onPress={showLogputAlert}>
            <View
              style={{
                padding: 8,
                backgroundColor: colors.rose,
                borderRadius: 100,
              }}
            >
              <Ionicons
                name="log-out-outline"
                size={30}
                color={colors.white}
                style={styles.logoutIcon}
              />
            </View>
          </TouchableOpacity>
          <MyBtn onPress={handleUpdateProfile} title="Update" fontSize={18} loading={isLoading} />
        </View>
      </View>
    </View>
  );
};

export default ProfileModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.white,
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    minHeight: "100%",
  },
  header: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  userDataContainer: {
    padding: 16,
  },
  footer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: 20,
    gap: 10,
    paddingTop: 15,
    marginBottom: 15,
    marginHorizontal: 20,
  },
  logoutIcon: {
    padding: 4,
  },
});

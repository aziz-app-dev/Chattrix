import { colors } from "@/constants/theme";
import { useAuth } from "@/context/auth_context";
import { useSocket } from "@/context/socket_context";
import { uploadImageToCloudinary } from "@/services/cloundinary_services";
import { updateProfileImage } from "@/services/profile_service";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { AppAlert } from "@/components/custom_alert";
import { Toast } from "@/components/toast";

interface ProfileImagePickerProps {
  currentImage: string | null;
  onImageUpdated?: (newImageUrl: string) => void;
  size?: number;
}

const ProfileImagePicker: React.FC<ProfileImagePickerProps> = ({
  currentImage,
  onImageUpdated,
  size = 110,
}) => {
  const { token, user, updateToken } = useAuth();
  const { emitProfileUpdate } = useSocket();
  const [isLoading, setIsLoading] = useState(false);

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      AppAlert.alert(
        "Permission Required",
        "Please allow access to your photo library to change your profile picture.",
        undefined,
        "warning"
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await handleImageUpload(result.assets[0].uri);
    }
  };

  const handleImageUpload = async (imageUri: string) => {
    if (!token || !user?.id) {
      Toast.error("You must be logged in to update your profile image.", "Not signed in");
      return;
    }

    setIsLoading(true);

    try {
      // Upload to Cloudinary
      const cloudinaryUrl = await uploadImageToCloudinary(imageUri);

      if (!cloudinaryUrl) {
        throw new Error("Failed to upload image to Cloudinary");
      }

      console.log("📷 Image uploaded to Cloudinary:", cloudinaryUrl);

      // Update profile image via API
      const response = await updateProfileImage(token, cloudinaryUrl);

      // Update the token with new user data
      if (response.token) {
        await updateToken(response.token);
      }

      // Emit socket event to notify other users
      emitProfileUpdate(user.id, cloudinaryUrl);

      // Notify parent component
      onImageUpdated?.(cloudinaryUrl);

      Toast.success("Profile image updated successfully!");
    } catch (error: any) {
      console.log("📷 [ProfileImagePicker] update error:", error?.message);
      Toast.error(error.message || "Failed to update profile image.", "Upload failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Image
        source={
          currentImage
            ? { uri: currentImage }
            : require("@/assets/images/3d_profile.png")
        }
        style={[styles.image, { borderRadius: size }]}
      />

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.white} />
        </View>
      )}

      <TouchableOpacity
        style={styles.editButton}
        onPress={pickImage}
        disabled={isLoading}
      >
        <Ionicons
          name="pencil-outline"
          size={15}
          color={colors.black}
          style={styles.editIcon}
        />
      </TouchableOpacity>
    </View>
  );
};

export default ProfileImagePicker;

const styles = StyleSheet.create({
  container: {
    alignSelf: "center",
    backgroundColor: colors.neutral300,
    borderRadius: 200,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  editButton: {
    position: "absolute",
    right: 5,
    bottom: 6,
    backgroundColor: colors.neutral200,
    borderRadius: 100,
    padding: 2,
  },
  editIcon: {
    padding: 4,
  },
});

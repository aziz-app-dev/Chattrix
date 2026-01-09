import { UPDATE_PROFILE_IMAGE_URL, UPDATE_PROFILE_NAME_URL } from "@/constants/urls";
import axios from "axios";

export const updateProfileImage = async (
  token: string,
  imageUrl: string
): Promise<{ token: string }> => {
  try {
    const response = await axios.patch(
      UPDATE_PROFILE_IMAGE_URL,
      { img: imageUrl },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("📷 Profile image update response:", response.data);
    return response.data.data;
  } catch (error: any) {
    console.log("Profile image update error:", error);
    const msg = error?.response?.data?.message || "Failed to update profile image";
    throw new Error(msg);
  }
};

export const updateProfileName = async (
  token: string,
  name: string
): Promise<{ token: string }> => {
  try {
    const response = await axios.patch(
      UPDATE_PROFILE_NAME_URL,
      { name },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("📝 Profile name update response:", response.data);
    return response.data.data;
  } catch (error: any) {
    console.log("Profile name update error:", error);
    const msg = error?.response?.data?.message || "Failed to update profile name";
    throw new Error(msg);
  }
};

 const CLOUDINARY_CLOD_NAME ="dh9yyhavk";
 const CLOUDINARY_CLOD_PRESENT ="react_native";

export const uploadImageToCloudinary = async (
  imageUri: string
): Promise<string | null> => {
  try {
    const formData = new FormData();

    formData.append("file", {
      uri: imageUri,
      type: "image/jpeg",
      name: "upload.jpg",
    } as any);

    formData.append("upload_preset", CLOUDINARY_CLOD_PRESENT);
    formData.append("cloud_name", CLOUDINARY_CLOD_NAME);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    const data = await res.json();

    if (!data.secure_url) {
      console.log("Image Upload failed" ,data);
      throw new Error("Upload failed");
    }

    return data.secure_url; // ✅ FINAL IMAGE URL
  } catch (error) {
    console.log("Cloudinary upload error:", error);
    return null;
  }
};

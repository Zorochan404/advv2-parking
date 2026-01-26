import axios from "axios";

const CLOUD_NAME = "dobngibkc";
const UPLOAD_PRESET = "images_preset"; // configure in Cloudinary

type ResourceType = "image" | "video" | "raw";

// Extend FormData value type for React Native
type RNFile = {
  uri: string;
  type: string;
  name: string;
};

/**
 * Detects the Cloudinary resource type based on file extension
 */
const getResourceType = (uri: string): ResourceType => {

  const ext = uri.split(".").pop()?.toLowerCase();

  if (!ext) return "raw";

  if (["jpg", "jpeg", "png", "gif", "webp", "bmp", "tiff"].includes(ext))
    return "image";
  if (["mp4", "mov", "avi", "mkv", "webm"].includes(ext)) return "video";
  if (["pdf", "doc", "docx", "xls", "xlsx", "txt", "zip"].includes(ext))
    return "raw";

  return "raw";
};

/**
 * Upload file (image, video, pdf, etc.) to Cloudinary
 * @param fileUri - Local file URI
 * @returns Uploaded file URL
 */
export const uploadToCloudinary = async (
  file: string | Blob
): Promise<string> => {
  try {
    const formData = new FormData();

    if (typeof file === "string") {
      // Mobile (fileUri)
      const extension = file.split(".").pop() || "jpg";
      // @ts-ignore
      formData.append("file", {
        // @ts-ignore
        uri: file,
        type: `image/${extension}`,
        name: `upload.${extension}`,
      });
    } else {
      // Web (Blob)
      formData.append("file", file);
    }

    formData.append("upload_preset", UPLOAD_PRESET);

    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data.secure_url as string;
  } catch (error: any) {
    console.error(
      "Cloudinary Upload Error:",
      error.response?.data || error.message
    );
    throw error;
  }
};

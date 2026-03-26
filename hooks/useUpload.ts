import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/store";
import { Platform } from "react-native";

export interface UploadResponse {
  public_id: string;
  url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

export const useUpload = () => {
  const { token } = useAuthStore.getState();

  const uploadMutation = useMutation({
    mutationFn: async (uri: string): Promise<UploadResponse> => {
      console.log(`🚀 [useUpload] Fetch-based upload: ${uri.substring(0, 40)}...`);

      const filename = uri.split("/").pop() || `image_${Date.now()}.jpg`;
      const extension = filename.split(".").pop()?.toLowerCase() || "jpg";
      const type = extension === "jpg" ? "image/jpeg" : `image/${extension}`;

      const formData = new FormData();
      // Use suggested URI logic
      const finalUri = Platform.OS === "android" ? uri : uri.replace("file://", "");
      
      // @ts-ignore
      formData.append("file", {
        uri: finalUri,
        name: filename,
        type: type,
      });

      const baseUrl = process.env.EXPO_PUBLIC_SERVER_URL || "https://bengo-backend.onrender.com/api/v1";
      const url = `${baseUrl}/upload`;

      try {
        console.log(`📡 [useUpload] Calling fetch to: ${url}`);
        const response = await fetch(url, {
          method: "POST",
          body: formData,
          headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json",
            "Content-Type": "multipart/form-data",
          },
        });

        console.log(`📡 [useUpload] Response Status: ${response.status}`);
        
        const responseData = await response.json();
        
        if (response.ok) {
           const result = responseData.data?.data || responseData.data || responseData;
           console.log(`✅ [useUpload] Success:`, !!result);
           return result;
        } else {
           console.warn("⚠️ [useUpload] Upload Failed:", JSON.stringify(responseData));
           throw new Error(responseData.message || `Lỗi server ${response.status}`);
        }
      } catch (err: any) {
        console.error("🔥 [useUpload] Final Fetch Error:", err);
        throw err;
      }
    },
  });

  return {
    uploadImage: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    uploadError: uploadMutation.error ? (uploadMutation.error as any).message : null,
  };
};

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";

import { useUpload } from "@/hooks/useUpload";
import { useDriverOrderDetail } from "@/hooks/useDriver";
import { fetchAPI } from "@/lib/fetch";
import CustomButton from "@/components/Common/CustomButton";
import CustomModal from "@/components/Common/CustomModal";
import PageHeader from "@/components/Common/PageHeader";
import { SafeAreaView } from "react-native-safe-area-context";

const DeliveryProofScreen = () => {
  const { id } = useLocalSearchParams();
  const navigation = useNavigation<any>();
  const router = useRouter();
  const { uploadImage, isUploading } = useUpload();
  const { data: order } = useDriverOrderDetail(id as string);

  React.useEffect(() => {
    console.log('🚀 [DEBUG] DeliveryProofScreen Rendered');
    console.log('🆔 Order ID:', id);
    console.log('📊 Order Status:', order?.status);
  }, [id, order?.status]);

  const [proofImage, setProofImage] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadSource, setUploadSource] = useState<"camera" | "library" | null>(null);

  const [alertModal, setAlertModal] = useState({
    visible: false,
    title: "",
    message: "",
    onConfirm: undefined as (() => void) | undefined,
  });

  const showAlert = (title: string, message: string, onConfirm?: () => void) => {
    setAlertModal({ visible: true, title, message, onConfirm });
  };

  const closeAlert = () => {
    setAlertModal((prev) => ({ ...prev, visible: false }));
    if (alertModal.onConfirm) {
      alertModal.onConfirm();
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      showAlert("Quyền truy cập", "Vui lòng cho phép quyền truy cập camera để chụp ảnh xác thực.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      handleImageSelection(result.assets[0].uri, "camera");
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      handleImageSelection(result.assets[0].uri, "library");
    }
  };

  const handleImageSelection = async (uri: string, source: "camera" | "library") => {
    setUploadSource(source);
    try {
      const uploadRes = await uploadImage(uri);
      if (uploadRes && uploadRes.url) {
        setProofImage(uploadRes.url);
      }
    } catch (error: any) {
      showAlert("Lỗi", "Không thể tải ảnh lên. Vui lòng thử lại.");
    } finally {
      setUploadSource(null);
    }
  };

  const handleSubmit = async () => {
    if (!proofImage) {
      showAlert("Thiếu thông tin", "Vui lòng chụp ảnh xác thực việc giao hàng.");
      return;
    }

    const apiPath = `/(api)/orders/delivery-proof/${id}`;
    const payload = {
      proofImage: proofImage,
      notes: notes,
    };

    setIsSubmitting(true);
    console.log("📤 [API Request] Submitting Delivery Proof...");
    console.log("🆔 ID:", id);
    console.log("📦 Payload:", JSON.stringify(payload, null, 2));

    try {
      const response = await fetchAPI(apiPath, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      console.log("✅ [API Success] Order Completed Successfully");
      console.log("📊 Response Data:", JSON.stringify(response, null, 2));

      showAlert("Thành công", "Đơn hàng đã được giao và xác thực thành công!", () => {
        router.replace(`/(driver)/history/${id}` as any);
      });
    } catch (error: any) {
      console.error("❌ [API Error] Delivery Proof Failed:", error);
      showAlert("Lỗi", error.message || "Không thể hoàn tất đơn hàng. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100" edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <PageHeader title="Xác thực giao hàng" onBackPress={() => {
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            router.replace(`/(driver)/active-trip/${id}` as any);
          }
        }} />

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.iconContainer}>
            <View style={styles.cameraIconWrapper} className="border border-green-200">
              <Ionicons name="camera-outline" size={32} color="#10B981" />
            </View>
            <Text style={styles.title}>Minh chứng giao hàng</Text>
            <Text style={styles.subtitle}>Chụp ảnh kiện hàng tại điểm giao để hoàn tất</Text>
          </View>

          <View style={styles.content}>
            {proofImage ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: proofImage }} style={styles.imagePreview} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => setProofImage(null)}
                >
                  <Ionicons name="close-circle" size={28} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.uploadButtonsContainer}>
                <TouchableOpacity
                  onPress={takePhoto}
                  disabled={!!uploadSource}
                  style={styles.uploadButton}
                >
                  {uploadSource === "camera" ? (
                    <ActivityIndicator color="#10B981" />
                  ) : (
                    <>
                      <Ionicons name="camera" size={40} color="#9CA3AF" />
                      <Text style={styles.uploadButtonText}>Chụp ảnh mới</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={pickImage}
                  disabled={!!uploadSource}
                  style={styles.uploadButton}
                >
                  {uploadSource === "library" ? (
                    <ActivityIndicator color="#10B981" />
                  ) : (
                    <>
                      <Ionicons name="images" size={40} color="#9CA3AF" />
                      <Text style={styles.uploadButtonText}>Chọn từ thư viện</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Ghi chú (không bắt buộc)</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Nhập ghi chú cho đơn hàng..."
                multiline
                numberOfLines={4}
                value={notes}
                onChangeText={setNotes}
                textAlignVertical="top"
              />
            </View>
          </View>
        </ScrollView>

        <View className="p-4">
          <CustomButton
            title="Hoàn tất giao hàng"
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={!proofImage || !!uploadSource}
            bgVariant={!proofImage ? "secondary" : "primary"}
            IconLeft={() => <Ionicons name="checkmark-circle" size={24} color="white" />}
          />
        </View>
      </KeyboardAvoidingView>

      <CustomModal
        visible={alertModal.visible}
        title={alertModal.title}
        message={alertModal.message}
        onClose={closeAlert}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginRight: 40,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  iconContainer: {
    marginTop: 24,
    marginBottom: 32,
    alignItems: "center",
  },
  cameraIconWrapper: {
    backgroundColor: "#F0FDF4",
    padding: 16,
    borderRadius: 999,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },
  subtitle: {
    color: "#6B7280",
    textAlign: "center",
    fontSize: 16,
  },
  content: {
    marginBottom: 32,
  },
  imagePreviewContainer: {
    position: "relative",
    width: "100%",
    height: 300,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
  },
  removeImageButton: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "white",
    borderRadius: 999,
  },
  uploadButtonsContainer: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  uploadButton: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#D1D5DB",
    height: 176,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadButtonText: {
    color: "#6B7280",
    fontWeight: "bold",
    marginTop: 8,
  },
  inputContainer: {
    marginTop: 24,
  },
  label: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  textArea: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    padding: 16,
    minHeight: 120,
    fontSize: 16,
    color: "#1F2937",
  },
  footer: {
    padding: 20,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
});

export default DeliveryProofScreen;

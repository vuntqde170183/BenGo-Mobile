import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, Stack } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { StatusBar } from "expo-status-bar";

import { useDriverDocuments, useUpdateDriverDocuments } from "@/hooks/useDriver";
import { useUpload } from "@/hooks/useUpload";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useAuth } from "@/context/AuthContext";
import CustomButton from "@/components/Common/CustomButton";
import CustomModal from "@/components/Common/CustomModal";
import InputField from "@/components/Common/InputField";

const ImageUploadBox = ({
  label,
  imageUri,
  onPress,
  isUploading
}: {
  label: string;
  imageUri: string | null;
  onPress: () => void;
  isUploading?: boolean;
}) => (
  <View className="mb-4">
    <Text className="text-gray-700 font-JakartaSemiBold mb-2 ml-1">{label}</Text>
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      disabled={isUploading}
      className={`h-40 w-full rounded-2xl border-2 border-dashed border-gray-300 bg-white overflow-hidden items-center justify-center`}
    >
      {isUploading ? (
        <View className="items-center justify-center">
          <ActivityIndicator color="#059669" size="large" />
          <Text className="text-gray-400 font-JakartaMedium text-xs mt-2">Đang tải lên...</Text>
        </View>
      ) : imageUri ? (
        <Image source={{ uri: imageUri }} className="w-full h-full" resizeMode="cover" />
      ) : (
        <View className="items-center">
          <Ionicons name="camera-outline" size={40} color="#94A3B8" />
          <Text className="text-gray-400 font-JakartaMedium text-sm mt-2">Nhấn để tải ảnh</Text>
        </View>
      )}
    </TouchableOpacity>
  </View>
);

const SectionTitle = ({ title, icon }: { title: string; icon: any }) => (
  <View className="flex-row items-center my-2">
    <View className="bg-green-600 w-7 h-7 rounded-full items-center justify-center mr-2 border border-green-200">
      <Ionicons name={icon} size={14} color="#ffffff" />
    </View>
    <Text className="text-lg font-JakartaBold text-green-600">{title}</Text>
  </View>
);

const UpdateVerificationScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const userIdFromAuth = (user?._id || user?.id || null) as string | null;
  const { data: profileData } = useProfile();

  const effectiveUserId = userIdFromAuth || profileData?._id || profileData?.id || null;

  const { data: docData, isLoading: docsLoading, refetch } = useDriverDocuments(effectiveUserId);
  const profileStatus = docData?.data?.driverProfile?.status || profileData?.status || "PENDING";

  const { mutateAsync: updateDocs } = useUpdateDriverDocuments();
  const { mutateAsync: updateProfile } = useUpdateProfile();
  const { uploadImage, isUploading: isGlobalUploading } = useUpload();
  const [form, setForm] = useState({
    identityNumber: "",
    identityFront: null as string | null,
    identityBack: null as string | null,
    licenseNumber: "",
    licenseImage: null as string | null,
    plateNumber: "",
    vehicleType: "",
    registrationImage: null as string | null,
    bankName: "",
    accountNumber: "",
    accountHolder: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingAction, setLoadingAction] = useState("");
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const [alertModal, setAlertModal] = useState({
    visible: false,
    title: "",
    message: "",
    onConfirm: undefined as (() => void) | undefined
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

  useEffect(() => {
    if (docData?.data?.driverProfile) {
      const p = docData.data.driverProfile;
      setForm({
        identityNumber: p.identityNumber || "",
        identityFront: p.identityFrontImage || null,
        identityBack: p.identityBackImage || null,
        licenseNumber: p.drivingLicenseNumber || "",
        licenseImage: p.licenseImage || null,
        plateNumber: p.plateNumber || "",
        vehicleType: p.vehicleType || "",
        registrationImage: p.vehicleRegistrationImage || null,
        bankName: p.bankInfo?.bankName || "",
        accountNumber: p.bankInfo?.accountNumber || "",
        accountHolder: p.bankInfo?.accountHolder || "",
      });
    }
  }, [docData]);

  const handlePickImage = async (field: "identityFront" | "identityBack" | "licenseImage" | "registrationImage") => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAlert("Lỗi", "Cần quyền truy cập ảnh để tải tài liệu!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const selectedUri = result.assets[0].uri;
      setUploadingField(field);

      try {
        console.log(`📡 [DriverVerification] Auto-uploading ${field}:`, selectedUri.substring(0, 30));
        const res = await uploadImage(selectedUri);

        if (res?.url) {
          console.log(`✅ [DriverVerification] Upload success for ${field}:`, res.url);
          setForm(prev => ({ ...prev, [field]: res.url }));
        } else {
          showAlert("Lỗi", "Không thể tải ảnh lên. Vui lòng thử lại!");
        }
      } catch (err) {
        console.error(`🔥 [DriverVerification] Auto-upload fail for ${field}:`, err);
        showAlert("Lỗi", "Đã xảy ra lỗi trong quá trình tải ảnh.");
      } finally {
        setUploadingField(null);
      }
    }
  };

  const validate = () => {
    if (!form.identityNumber || !form.identityFront || !form.identityBack) return "Vui lòng cung cấp đầy đủ thông tin Định danh & ảnh 2 mặt CCCD.";
    if (!form.licenseNumber || !form.licenseImage) return "Vui lòng cung cấp Số GPLX và ảnh chụp.";
    if (!form.plateNumber || !form.vehicleType || !form.registrationImage) return "Vui lòng cung cấp thông tin Phương tiện & ảnh Đăng ký xe.";
    return null;
  };

  const handleSubmit = async () => {
    console.log("🚀 [DriverVerification] handleSubmit Clicked");
    const error = validate();
    if (error) {
      console.log("❌ [DriverVerification] Validation Fail:", error);
      showAlert("Thiếu thông tin", error);
      return;
    }

    try {
      if (!effectiveUserId) {
        console.log("❌ [DriverVerification] Missing userId");
        showAlert("Lỗi", "Không tìm thấy thông tin định danh người dùng.");
        return;
      }

      setIsSubmitting(true);
      setLoadingAction("Đang gửi hồ sơ...");

      const payloadDocs = {
        identityFront: { id: effectiveUserId, type: "IDENTITY_FRONT", imageUrl: form.identityFront!, identityNumber: form.identityNumber },
        identityBack: { id: effectiveUserId, type: "IDENTITY_BACK", imageUrl: form.identityBack! },
        license: { id: effectiveUserId, type: "DRIVING_LICENSE", imageUrl: form.licenseImage!, drivingLicenseNumber: form.licenseNumber },
        vehicle: { id: effectiveUserId, type: "VEHICLE_REGISTRATION", imageUrl: form.registrationImage!, plateNumber: form.plateNumber, vehicleType: form.vehicleType }
      };

      console.log("🛠️ [DriverVerification] Submit Documents Payloads:", JSON.stringify(payloadDocs, null, 2));

      // Sequential submission with delay for Render Free Tier
      const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

      setLoadingAction("Đang gửi Định danh mặt trước...");
      await updateDocs(payloadDocs.identityFront as any);
      await sleep(1000);

      setLoadingAction("Đang gửi Định danh mặt sau...");
      await updateDocs(payloadDocs.identityBack as any);
      await sleep(1000);

      setLoadingAction("Đang gửi bằng lái xe...");
      await updateDocs(payloadDocs.license as any);
      await sleep(1000);

      setLoadingAction("Đang gửi đăng ký xe...");
      await updateDocs(payloadDocs.vehicle as any);

      console.log("🎉 [DriverVerification] All Documents Submitted Successfully");
      showAlert("Thành công", "Hồ sơ của bạn đã được gửi xét duyệt.", () => router.push("/(driver)/documents"));
    } catch (err) {
      console.error("🔥 [DriverVerification] Error in handleSubmit:", err);
      showAlert("Lỗi", "Không thể gửi hồ sơ. Vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProfile = async () => {
    console.log("🚀 [DriverVerification] handleUpdateProfile Clicked");
    const error = validate();
    if (error) {
      console.log("❌ [DriverVerification] Validation Fail:", error);
      showAlert("Thiếu thông tin", error);
      return;
    }

    try {
      setIsSubmitting(true);
      setLoadingAction("Đang cập nhật hồ sơ...");

      const profileUpdatePayload = {
        phone: profileData?.phone,
        email: profileData?.email,
        name: profileData?.name,
        avatar: profileData?.avatar,
        driverProfile: {
          vehicleType: form.vehicleType,
          plateNumber: form.plateNumber,
          licenseImage: form.licenseImage || undefined,
          identityNumber: form.identityNumber,
          identityFrontImage: form.identityFront || undefined,
          identityBackImage: form.identityBack || undefined,
          drivingLicenseNumber: form.licenseNumber,
          vehicleRegistrationImage: form.registrationImage || undefined,
          bankInfo: {
            bankName: form.bankName,
            accountNumber: form.accountNumber,
            accountHolder: form.accountHolder,
          },
        }
      };
      console.log("🛠️ [DriverVerification] Update Profile Payload:", JSON.stringify(profileUpdatePayload, null, 2));

      await updateProfile(profileUpdatePayload);

      showAlert("Thành công", "Hồ sơ của bạn đã được cập nhật.");
      refetch();
    } catch (err) {
      console.error("🔥 [DriverVerification] Error in updateProfile:", err);
      showAlert("Lỗi", "Không thể cập nhật hồ sơ. Vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (docsLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#0047AB" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100" edges={["top", "bottom"]}>
      <StatusBar style="dark" />
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#111827" />
        </TouchableOpacity>
        <Text className="flex-1 text-center font-JakartaBold text-lg text-gray-700 pr-8">
          Hoàn thiện hồ sơ
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
          <Text className="text-gray-500 font-Jakarta text-base mt-4 text-center">
            Vui lòng nhập chính xác và chụp ảnh rõ nét các thông tin bên dưới để được phê duyệt nhanh hơn.
          </Text>

          <SectionTitle title="Thông tin Định danh" icon="id-card-outline" />
          <InputField
            label="Số CCCD"
            placeholder="Nhập 12 số CCCD"
            value={form.identityNumber}
            onChangeText={(text) => setForm(prev => ({ ...prev, identityNumber: text }))}
            keyboardType="numeric"
            icon="finger-print-outline"
          />
          <View className="flex-row justify-between">
            <View className="w-[48%]">
              <ImageUploadBox
                label="CCCD Mặt trước"
                imageUri={form.identityFront}
                onPress={() => handlePickImage("identityFront")}
                isUploading={uploadingField === "identityFront"}
              />
            </View>
            <View className="w-[48%]">
              <ImageUploadBox
                label="CCCD Mặt sau"
                imageUri={form.identityBack}
                onPress={() => handlePickImage("identityBack")}
                isUploading={uploadingField === "identityBack"}
              />
            </View>
          </View>

          <SectionTitle title="Thông tin Bằng lái" icon="car-outline" />
          <InputField
            label="Số GPLX"
            placeholder="Nhập số bằng lái xe"
            value={form.licenseNumber}
            onChangeText={(text) => setForm(prev => ({ ...prev, licenseNumber: text }))}
            icon="browsers-outline"
          />
          <ImageUploadBox
            label="Ảnh chụp Bằng lái xe"
            imageUri={form.licenseImage}
            onPress={() => handlePickImage("licenseImage")}
            isUploading={uploadingField === "licenseImage"}
          />

          <SectionTitle title="Thông tin Phương tiện" icon="document-text-outline" />
          <InputField
            label="Biển số xe"
            placeholder="VD: 29A-12345"
            value={form.plateNumber}
            onChangeText={(text) => setForm(prev => ({ ...prev, plateNumber: text }))}
            icon="calendar-outline"
            autoCapitalize="characters"
          />
          <InputField
            label="Loại xe"
            placeholder="VD: BIKE, VAN, TRUCK"
            value={form.vehicleType}
            onChangeText={(text) => setForm(prev => ({ ...prev, vehicleType: text }))}
            icon="options-outline"
            autoCapitalize="characters"
          />
          <ImageUploadBox
            label="Ảnh chụp Đăng ký xe (Cà vẹt)"
            imageUri={form.registrationImage}
            onPress={() => handlePickImage("registrationImage")}
            isUploading={uploadingField === "registrationImage"}
          />

          <SectionTitle title="Thông tin Ngân hàng" icon="business-outline" />
          <InputField
            label="Tên ngân hàng"
            placeholder="VD: Vietcombank, MBBank..."
            value={form.bankName}
            onChangeText={(text) => setForm(prev => ({ ...prev, bankName: text }))}
            icon="home-outline"
          />
          <InputField
            label="Số tài khoản"
            placeholder="Nhập số tài khoản ngân hàng"
            value={form.accountNumber}
            keyboardType="numeric"
            onChangeText={(text) => setForm(prev => ({ ...prev, accountNumber: text }))}
            icon="card-outline"
          />
          <InputField
            label="Chủ tài khoản"
            placeholder="VD: NGUYEN VAN A"
            value={form.accountHolder}
            onChangeText={(text) => setForm(prev => ({ ...prev, accountHolder: text.toUpperCase() }))}
            icon="person-outline"
            autoCapitalize="characters"
          />

          <View className="h-32" />
        </ScrollView>
      </KeyboardAvoidingView>

      {profileStatus !== "APPROVED" && (<View className="p-4 bg-gray-100 border-t border-gray-100">
        <CustomButton
          title="Gửi yêu cầu duyệt"
          onPress={handleSubmit}
          loading={isSubmitting}
        />
      </View>
      )}

      <Modal visible={isSubmitting} transparent>
        <View className="flex-1 bg-black/40 items-center justify-center">
          <View className="bg-white p-4 rounded-3xl items-center shadow-lg">
            <ActivityIndicator size="large" color="#0047AB" />
            <Text className="font-JakartaBold text-lg mt-4 text-gray-700">{loadingAction}</Text>
            <Text className="font-Jakarta text-gray-500 mt-1">Vui lòng không đóng ứng dụng</Text>
          </View>
        </View>
      </Modal>

      <CustomModal
        visible={alertModal.visible}
        title={alertModal.title}
        message={alertModal.message}
        onClose={closeAlert}
      />
    </SafeAreaView>
  );
};

export default UpdateVerificationScreen;

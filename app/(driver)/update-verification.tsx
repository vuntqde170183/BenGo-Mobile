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
  onPress
}: {
  label: string;
  imageUri: string | null;
  onPress: () => void
}) => (
  <View className="mb-4">
    <Text className="text-gray-700 font-JakartaSemiBold mb-2 ml-1">{label}</Text>
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      className={`h-40 w-full rounded-2xl border-2 border-dashed border-gray-300 bg-white overflow-hidden items-center justify-center`}
    >
      {imageUri ? (
        <Image source={{ uri: imageUri }} className="w-full h-full" resizeMode="cover" />
      ) : (
        <View className="items-center">
          <Ionicons name="camera-outline" size={40} color="#94A3B8" />
          <Text className="text-slate-400 font-JakartaMedium text-sm mt-2">Nhấn để tải ảnh</Text>
        </View>
      )}
    </TouchableOpacity>
  </View>
);

const SectionTitle = ({ title, icon }: { title: string; icon: any }) => (
  <View className="flex-row items-center my-2">
    <View className="bg-green-50 w-12 h-12 rounded-2xl items-center justify-center mr-3 border border-green-200">
      <Ionicons name={icon} size={22} color="#10B981" />
    </View>
    <Text className="text-green-600 font-JakartaBold text-lg">{title}</Text>
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
  const { uploadImage, isUploading } = useUpload();

  useEffect(() => {
    if (docData) console.log("[UpdateVerification] API Data:", JSON.stringify(docData, null, 2));
  }, [docData]);

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

  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState("");

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
      setForm(prev => ({ ...prev, [field]: result.assets[0].uri }));
    }
  };

  const validate = () => {
    if (!form.identityNumber || !form.identityFront || !form.identityBack) return "Vui lòng cung cấp đầy đủ thông tin Định danh & ảnh 2 mặt CCCD.";
    if (!form.licenseNumber || !form.licenseImage) return "Vui lòng cung cấp Số GPLX và ảnh chụp.";
    if (!form.plateNumber || !form.vehicleType || !form.registrationImage) return "Vui lòng cung cấp thông tin Phương tiện & ảnh Đăng ký xe.";
    return null;
  };

  const handleSubmit = async () => {
    const error = validate();
    if (error) {
      showAlert("Thiếu thông tin", error);
      return;
    }

    try {
      if (!effectiveUserId) {
        showAlert("Lỗi", "Không tìm thấy thông tin định danh người dùng.");
        return;
      }

      setLoading(true);
      setLoadingAction("Đang tải ảnh lên...");

      const uploadIfNeeded = async (uri: string | null) => {
        if (!uri) return null;
        if (uri.startsWith("http")) return uri;
        const res = await uploadImage(uri);
        return res?.url || null;
      };

      const identityFrontUrl = await uploadIfNeeded(form.identityFront);
      const identityBackUrl = await uploadIfNeeded(form.identityBack);
      const licenseUrl = await uploadIfNeeded(form.licenseImage);
      const registrationUrl = await uploadIfNeeded(form.registrationImage);

      setLoadingAction("Đang cập nhật hồ sơ...");

      // 1. Identity
      await updateDocs({
        id: effectiveUserId,
        type: "IDENTITY_FRONT",
        imageUrl: identityFrontUrl!,
        identityNumber: form.identityNumber,
      });
      await updateDocs({
        id: effectiveUserId,
        type: "IDENTITY_BACK",
        imageUrl: identityBackUrl!,
      });

      // 2. License
      await updateDocs({
        id: effectiveUserId,
        type: "DRIVING_LICENSE",
        imageUrl: licenseUrl!,
        drivingLicenseNumber: form.licenseNumber,
      });

      // 3. Vehicle
      await updateDocs({
        id: effectiveUserId,
        type: "VEHICLE_REGISTRATION",
        imageUrl: registrationUrl!,
        plateNumber: form.plateNumber,
        vehicleType: form.vehicleType,
      });

      showAlert("Thành công", "Hồ sơ của bạn đã được gửi xét duyệt.", () => router.push("/documents"));
    } catch (err) {
      console.error(err);
      showAlert("Lỗi", "Không thể gửi hồ sơ. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    const error = validate();
    if (error) {
      showAlert("Thiếu thông tin", error);
      return;
    }

    try {
      setLoading(true);
      setLoadingAction("Đang tải ảnh lên...");

      const uploadIfNeeded = async (uri: string | null) => {
        if (!uri) return null;
        if (uri.startsWith("http")) return uri;
        const res = await uploadImage(uri);
        return res?.url || null;
      };

      const identityFrontUrl = await uploadIfNeeded(form.identityFront);
      const identityBackUrl = await uploadIfNeeded(form.identityBack);
      const licenseUrl = await uploadIfNeeded(form.licenseImage);
      const registrationUrl = await uploadIfNeeded(form.registrationImage);

      setLoadingAction("Đang cập nhật hồ sơ...");

      await updateProfile({
        phone: profileData?.phone,
        email: profileData?.email,
        name: profileData?.name,
        avatar: profileData?.avatar,
        driverProfile: {
          vehicleType: form.vehicleType,
          plateNumber: form.plateNumber,
          licenseImage: licenseUrl || undefined,
          identityNumber: form.identityNumber,
          identityFrontImage: identityFrontUrl || undefined,
          identityBackImage: identityBackUrl || undefined,
          drivingLicenseNumber: form.licenseNumber,
          vehicleRegistrationImage: registrationUrl || undefined,
          bankInfo: {
            bankName: form.bankName,
            accountNumber: form.accountNumber,
            accountHolder: form.accountHolder,
          },
        }
      });

      showAlert("Thành công", "Hồ sơ của bạn đã được cập nhật.");
      refetch();
    } catch (err) {
      console.error(err);
      showAlert("Lỗi", "Không thể cập nhật hồ sơ. Vui lòng thử lại!");
    } finally {
      setLoading(false);
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
          Cập nhật hồ sơ
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
              />
            </View>
            <View className="w-[48%]">
              <ImageUploadBox
                label="CCCD Mặt sau"
                imageUri={form.identityBack}
                onPress={() => handlePickImage("identityBack")}
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

      <View className="p-4 bg-gray-100 border-t border-gray-100">
        {profileStatus !== "APPROVED" ? (
          <CustomButton
            title="Gửi yêu cầu duyệt"
            onPress={handleSubmit}
            loading={loading || isUploading}
          />
        ) : (
          <CustomButton
            title="Cập nhật hồ sơ"
            onPress={handleUpdateProfile}
            loading={loading || isUploading}
          />
        )}
      </View>

      <Modal visible={loading} transparent>
        <View className="flex-1 bg-black/40 items-center justify-center">
          <View className="bg-white p-6 rounded-3xl items-center shadow-lg">
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

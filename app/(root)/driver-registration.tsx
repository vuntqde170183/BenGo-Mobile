import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import * as ImagePicker from "expo-image-picker";

import PageHeader from "@/components/Common/PageHeader";
import CustomButton from "@/components/Common/CustomButton";
import CustomModal from "@/components/Common/CustomModal";
import InputField from "@/components/Common/InputField";
import { icons } from "@/constants";
import { fetchAPI } from "@/lib/fetch";

export default function DriverRegistrationScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

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

  const [form, setForm] = useState({
    phone: "",
    license_number: "",
    vehicle_type: "car",
    car_seats: "4",
    license_photo_uri: null as string | null,
    vehicle_photo_uri: null as string | null,
    profile_photo_uri: null as string | null,
    license_image_url: null as string | null,
    car_image_url: null as string | null,
    profile_image_url: null as string | null,
  });

  useEffect(() => {
    const fetchDriverData = async () => {
      if (!user?.id) return;
      try {
        const response = await fetchAPI(
          `/(api)/driver/profile?user_id=${user.id}`,
          { method: "GET" }
        );

        if (response.success && response.data) {
          const d = response.data;
          setForm({
            phone: d.phone || "",
            license_number: d.license_number || "",
            vehicle_type: d.vehicle_type || "car",
            car_seats: d.car_seats?.toString() || "4",
            license_photo_uri: d.license_image_url || null,
            vehicle_photo_uri: d.car_image_url || null,
            profile_photo_uri: d.profile_image_url || null,
            license_image_url: d.license_image_url || null,
            car_image_url: d.car_image_url || null,
            profile_image_url: d.profile_image_url || null,
          });
        }
      } catch (error: any) {
      }
    };

    fetchDriverData();
  }, [user?.id]);

  const [uploadingImage, setUploadingImage] = useState<{
    license: boolean;
    vehicle: boolean;
    profile: boolean;
  }>({
    license: false,
    vehicle: false,
    profile: false,
  });

  const vehicleTypes = [
    { value: "car", label: t("driver.car"), icon: "car-outline", seats: 4 },
    { value: "suv", label: "SUV", icon: "car-sport-outline", seats: 6 },
    {
      value: "bike",
      label: t("driver.bike"),
      icon: "bicycle-outline",
      seats: 1,
    },
  ];

  const pickImage = async (type: "license" | "vehicle" | "profile") => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === "profile" ? [1, 1] : [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      const photoKey = `${type}_photo_uri` as keyof typeof form;

      setForm((prev) => ({ ...prev, [photoKey]: uri }));

      await uploadImageToCloudinary(type, uri);
    }
  };

  const uploadImageToCloudinary = async (
    type: "license" | "vehicle" | "profile",
    uri: string
  ) => {
    try {
      setUploadingImage((prev) => ({ ...prev, [type]: true }));

      // Convert URI to base64
      const response = await fetch(uri);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      // Upload to Cloudinary via API
      const uploadResponse = await fetchAPI("/(api)/upload-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base64,
          folder: `uber-clone/driver-documents/${type}`,
          publicId: `driver_${user?.id}_${type}_${Date.now()}`,
        }),
      });

      if (!uploadResponse.success) {
        throw new Error(uploadResponse.error || "Upload failed");
      }

      const cloudinaryUrl = uploadResponse.data.url;

      // Map type to URL field name
      const urlFieldMap = {
        license: "license_image_url",
        vehicle: "car_image_url",
        profile: "profile_image_url",
      } as const;

      // Store the Cloudinary URL
      const urlKey = urlFieldMap[type] as keyof typeof form;

      setForm((prev) => {
        const updatedForm = { ...prev, [urlKey]: cloudinaryUrl };
        return updatedForm;
      });
    } catch (error: any) {
      showAlert(
        t("common.error"),
        `Lỗi khi tải ảnh ${type} lên: ${error.message}`
      );

      // Clear the local URI on error
      const photoKey = `${type}_photo_uri` as keyof typeof form;
      setForm((prev) => ({ ...prev, [photoKey]: null }));
    } finally {
      setUploadingImage((prev) => ({ ...prev, [type]: false }));
    }
  };

  const handleSubmit = async () => {
    if (
      uploadingImage.license ||
      uploadingImage.vehicle ||
      uploadingImage.profile
    ) {
      showAlert(
        t("common.error"),
        "Vui lòng đợi các ảnh tải lên hoàn tất trước khi gửi đơn."
      );
      return;
    }

    // Validate required fields with specific error messages
    const missingFields: string[] = [];

    if (!form.phone) {
      missingFields.push(t("profile.phone"));
    }
    if (!form.license_number) {
      missingFields.push(t("driver.licenseNumber"));
    }

    if (missingFields.length > 0) {
      showAlert(
        t("common.error"),
        `${t("driver.missingFields")}:\n• ${missingFields.join("\n• ")}`
      );
      return;
    }

    const missingPhotos: string[] = [];

    if (!form.license_image_url) {
      missingPhotos.push(t("driver.licensePhoto"));
    }
    if (!form.car_image_url) {
      missingPhotos.push(t("driver.vehiclePhoto"));
    }
    if (!form.profile_image_url) {
      missingPhotos.push(t("driver.profilePhoto"));
    }

    if (missingPhotos.length > 0) {
      showAlert(
        t("common.error"),
        `${t("driver.missingPhotos")}:\n• ${missingPhotos.join("\n• ")}`
      );
      return;
    }

    setLoading(true);

    const submitData = {
      user_id: user?.id,
      email: user?.email,
      name: user?.name || "",
      phone: form.phone,
      license_number: form.license_number,
      vehicle_type: form.vehicle_type,
      car_seats: parseInt(form.car_seats),
      license_image_url: form.license_image_url,
      car_image_url: form.car_image_url,
      profile_image_url: form.profile_image_url,
    };

    try {
      // Register driver with all data including image URLs
      setUploadStatus("Đang đăng ký tài xế...");
      const registerResponse = await fetchAPI("/(api)/driver/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      if (!registerResponse.success) {
        throw new Error(
          registerResponse.error || t("driver.registrationFailed")
        );
      }

      showAlert(t("common.success"), t("driver.registrationSuccess"), () => router.replace("/(root)/tabs/profile"));
    } catch (error: any) {
      showAlert(
        t("common.error"),
        error.message || t("driver.registrationFailed")
      );
    } finally {
      setLoading(false);
      setUploadStatus("");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-general-500">
      <PageHeader title={t("driver.becomeDriver")} />
      <ScrollView
        className="flex-1 px-4 pt-4"
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <View className="bg-green-50 p-4 rounded-2xl mb-4 border border-green-200">
          <View className="flex-row items-center mb-2">
            <Ionicons name="information-circle" size={20} color="#10B981" />
            <Text className="ml-2 text-lg font-JakartaBold text-green-800">
              {t("driver.requirements")}
            </Text>
          </View>
          <Text className="text-base font-JakartaMedium text-green-700">
            • {t("driver.validLicense")}
            {"\n"}• {t("driver.vehicleRegistration")}
            {"\n"}• {t("driver.cleanRecord")}
            {"\n"}• {t("driver.approvalTime")}
          </Text>
        </View>

        {/* Personal Info */}
        <Text className="text-lg font-JakartaBold">
          {t("driver.personalInfo")}
        </Text>

        <InputField
          label={t("profile.phone")}
          placeholder="+84 123 456 789"
          icon={icons.chat}
          iconStyle="text-green-500"
          value={form.phone}
          onChangeText={(value: string) =>
            setForm((prev) => ({ ...prev, phone: value }))
          }
          keyboardType="phone-pad"
        />

        <InputField
          label={t("driver.licenseNumber")}
          placeholder="123456789"
          icon={icons.list}
          iconStyle="text-green-500"
          value={form.license_number}
          onChangeText={(value: string) =>
            setForm((prev) => ({ ...prev, license_number: value }))
          }
        />

        {/* Vehicle Type Selection */}
        <Text className="text-lg font-JakartaBold mb-4 mt-2">
          {t("driver.vehicleType")}
        </Text>
        <View className="flex-row justify-between mb-4">
          {vehicleTypes.map((type) => (
            <TouchableOpacity
              key={type.value}
              onPress={() =>
                setForm((prev) => ({
                  ...prev,
                  vehicle_type: type.value,
                  car_seats: type.seats.toString(),
                }))
              }
              className={`flex-1 mx-1 p-4 rounded-2xl border-2 ${form.vehicle_type === type.value
                ? "border-green-500 bg-green-50"
                : "border-gray-200 bg-white"
                }`}
            >
              <Ionicons
                name={type.icon as any}
                size={32}
                color={form.vehicle_type === type.value ? "#10B981" : "#6B7280"}
                style={{ alignSelf: "center", marginBottom: 8 }}
              />
              <Text
                className={`text-center font-JakartaBold ${form.vehicle_type === type.value
                  ? "text-green-700"
                  : "text-gray-700"
                  }`}
              >
                {type.label}
              </Text>
              <Text
                className={`text-center text-base font-JakartaMedium ${form.vehicle_type === type.value
                  ? "text-green-600"
                  : "text-gray-500"
                  }`}
              >
                {type.seats} {t("booking.seats")}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Document Upload */}
        <Text className="text-lg font-JakartaBold mb-4">
          {t("driver.documents")}
        </Text>

        {/* License Photo */}
        <TouchableOpacity
          onPress={() => pickImage("license")}
          className="mb-4 p-4 border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50"
          disabled={uploadingImage.license}
        >
          {form.license_photo_uri ? (
            <View>
              <Image
                source={{ uri: form.license_photo_uri }}
                className="w-full h-40 rounded-xl mb-2"
                resizeMode="cover"
              />
              {uploadingImage.license ? (
                <Text className="text-center text-blue-600 font-JakartaBold">
                  ⏳ Đang tải lên...
                </Text>
              ) : (
                <Text className="text-center text-green-600 font-JakartaBold">
                  ✓ {t("driver.licensePhoto")}
                </Text>
              )}
            </View>
          ) : (
            <View className="items-center py-3">
              <Ionicons name="card-outline" size={48} color="#9CA3AF" />
              <Text className="mt-2 text-gray-500 font-JakartaBold">
                {t("driver.uploadLicense")}
              </Text>
              <Text className="text-base text-gray-500 font-JakartaMedium">
                {t("driver.tapToUpload")}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Vehicle Photo */}
        <TouchableOpacity
          onPress={() => pickImage("vehicle")}
          className="mb-4 p-4 border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50"
          disabled={uploadingImage.vehicle}
        >
          {form.vehicle_photo_uri ? (
            <View>
              <Image
                source={{ uri: form.vehicle_photo_uri }}
                className="w-full h-40 rounded-xl mb-2"
                resizeMode="cover"
              />
              {uploadingImage.vehicle ? (
                <Text className="text-center text-blue-600 font-JakartaBold">
                  ⏳ Đang tải lên...
                </Text>
              ) : (
                <Text className="text-center text-green-600 font-JakartaBold">
                  ✓ {t("driver.vehiclePhoto")}
                </Text>
              )}
            </View>
          ) : (
            <View className="items-center py-3">
              <Ionicons name="car-outline" size={48} color="#9CA3AF" />
              <Text className="mt-2 text-gray-500 font-JakartaBold">
                {t("driver.uploadVehicle")}
              </Text>
              <Text className="text-base text-gray-500 font-JakartaMedium">
                {t("driver.tapToUpload")}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Profile Photo */}
        <TouchableOpacity
          onPress={() => pickImage("profile")}
          className="mb-4 p-4 border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50"
          disabled={uploadingImage.profile}
        >
          {form.profile_photo_uri ? (
            <View>
              <Image
                source={{ uri: form.profile_photo_uri }}
                className="w-32 h-32 rounded-full self-center mb-2"
                resizeMode="cover"
              />
              {uploadingImage.profile ? (
                <Text className="text-center text-blue-600 font-JakartaBold">
                  ⏳ Đang tải lên...
                </Text>
              ) : (
                <Text className="text-center text-green-600 font-JakartaBold">
                  ✓ {t("driver.profilePhoto")}
                </Text>
              )}
            </View>
          ) : (
            <View className="items-center py-3">
              <Ionicons
                name="person-circle-outline"
                size={48}
                color="#9CA3AF"
              />
              <Text className="mt-2 text-gray-500 font-JakartaBold">
                {t("driver.uploadProfile")}
              </Text>
              <Text className="text-base text-gray-500 font-JakartaMedium">
                {t("driver.tapToUpload")}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Submit Button */}
        <CustomButton
          title={
            uploadingImage.license ||
              uploadingImage.vehicle ||
              uploadingImage.profile
              ? "Đang tải ảnh lên..."
              : loading && uploadStatus
                ? uploadStatus
                : t("driver.submitApplication")
          }
          onPress={handleSubmit}
          disabled={
            loading ||
            uploadingImage.license ||
            uploadingImage.vehicle ||
            uploadingImage.profile
          }
          className="mb-4"
        />
      </ScrollView>

      <CustomModal
        visible={alertModal.visible}
        title={alertModal.title}
        message={alertModal.message}
        onClose={closeAlert}
      />
    </SafeAreaView>
  );
}

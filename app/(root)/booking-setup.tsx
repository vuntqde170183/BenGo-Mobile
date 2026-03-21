import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useTranslation } from "react-i18next";
import GoogleTextInput from "@/components/Common/GoogleTextInput";
import { useLocationStore } from "@/store";
import { fetchAPI } from "@/lib/fetch";
import CustomButton from "@/components/Common/CustomButton";
import CustomModal from "@/components/Common/CustomModal";
import TextArea from "@/components/Common/TextArea";
import InputField from "@/components/Common/InputField";
import { useUpload } from "@/hooks/useUpload";
const VEHICLE_TYPES = [
  { id: "BIKE", title: "Xe máy", icon: "bicycle", basePrice: 15000 },
  { id: "VAN", title: "Xe tải van", icon: "car-sport", basePrice: 150000 },
  { id: "TRUCK", title: "Xe tải", icon: "car", basePrice: 350000 },
];
const BookingSetupScreen = () => {
  const { t } = useTranslation();
  const {
    userAddress,
    userLatitude,
    userLongitude,
    destinationAddress,
    destinationLatitude,
    destinationLongitude,
    setUserLocation,
    setDestinationLocation
  } = useLocationStore();
  const [goodsName, setGoodsName] = useState("");
  const [goodsWeight, setGoodsWeight] = useState("");
  const [note, setNote] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState(VEHICLE_TYPES[1].id); // Default VAN
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

  const [estimation, setEstimation] = useState<{
    distance: number;
    duration: number;
    price: number;
  } | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { uploadImage, isUploading } = useUpload();

  // C3: API Estimate Trigger
  const fetchEstimate = async (vehicleType: string) => {
    if (!userLatitude || !destinationLatitude) return;

    setIsEstimating(true);
    try {
      const response = await fetchAPI("/(api)/orders/estimate", {
        method: "POST",
        body: JSON.stringify({
          origin: { lat: userLatitude, lng: userLongitude, address: userAddress },
          destination: { lat: destinationLatitude, lng: destinationLongitude, address: destinationAddress },
          vehicleType: vehicleType,
        }),
      });

      if (response && response.data) {
        setEstimation(response.data);
      } else {
        // Fallback mock estimate if API fails
        setEstimation({
          distance: 5.2,
          duration: 15,
          price: vehicleType === "VAN" ? 150000 : (vehicleType === "BIKE" ? 25000 : 450000),
        });
      }
    } catch (error) {
      console.error("Estimate Error:", error);
      // Fallback
      setEstimation({
        distance: 5.2,
        duration: 25,
        price: vehicleType === "VAN" ? 155000 : 35000,
      });
    } finally {
      setIsEstimating(false);
    }
  };

  useEffect(() => {
    fetchEstimate(selectedVehicle);
  }, [selectedVehicle, userLatitude, destinationLatitude]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      try {
        const uploadRes = await uploadImage(uri);

        if (uploadRes && uploadRes.url) {
          setImages(prev => [...prev, uploadRes.url]);
        }
      } catch (error) {
        console.error("[BookingSetup] Upload Error:", error);
        showAlert("Lỗi upload", "Không thể tải ảnh lên. Vui lòng thử lại.");
      }
    }
  };

  const handleCreateOrder = async () => {
    if (!goodsName || !goodsWeight || images.length === 0) {
      showAlert("Thiếu thông tin", "Vui lòng nhập tên hàng, khối lượng và thêm ít nhất 1 ảnh hàng hóa.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetchAPI("/(api)/orders", {
        method: "POST",
        body: JSON.stringify({
          origin: { lat: userLatitude, lng: userLongitude, address: userAddress },
          destination: { lat: destinationLatitude, lng: destinationLongitude, address: destinationAddress },
          vehicleType: selectedVehicle,
          goodsImages: images,
          note: `${goodsName} (${goodsWeight}kg). ${note}`,
        }),
      });

      if (response && response.data) {
        const orderId = response.data.id || response.data._id;
        showAlert("Thành công", "Đơn hàng của bạn đã được tạo.", () => {
          if (orderId) {
            router.push(`/order-detail/${orderId}`);
          } else {
            router.push("/(root)/tabs/activities");
          }
        });
      } else {
        // Fallback for demo
        showAlert("Đặt đơn thành công", "Đơn hàng của bạn đang được tìm tài xế.", () => router.push("/(root)/tabs/activities"));
      }
    } catch (error) {
      showAlert("Lỗi", "Không thể tạo đơn hàng lúc này. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100" edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row items-center px-4 py-4 border-b border-gray-100 bg-white">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="black" />
          </TouchableOpacity>
          <Text className="flex-1 text-center font-JakartaBold text-lg text-gray-700">Thông tin đơn hàng</Text>
        </View>

        <FlatList
          data={[]}
          renderItem={null}
          keyExtractor={() => "key"}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 16 }}
          ListHeaderComponent={
            <>
              {/* C1: New Address Card Design with GoogleTextInput */}
              <View className="flex-row items-center my-4">
                <View className="bg-green-600 w-8 h-8 rounded-full items-center justify-center mr-2 border border-green-200">
                  <Ionicons name="location-sharp" size={18} color="#ffffff" />
                </View>
                <Text className="text-green-600 font-JakartaBold text-xl">Chọn địa điểm</Text>
              </View>
              {/* Pickup Section */}
              <View className="mb-4" style={{ zIndex: 10 }}>
                <Text className="text-lg font-JakartaSemiBold mb-2 text-gray-700">Điểm lấy hàng</Text>
                <GoogleTextInput
                  initialLocation={userAddress || ""}
                  handlePress={(location) => setUserLocation(location)}
                  containerStyle="bg-gray-100"
                />
              </View>
              {/* Dropoff Section */}
              <View style={{ zIndex: 5 }}>
                <Text className="text-lg font-JakartaSemiBold mb-2 text-gray-700">Điểm giao hàng</Text>
                <GoogleTextInput
                  initialLocation={destinationAddress || ""}
                  handlePress={(location) => setDestinationLocation(location)}
                  containerStyle="bg-gray-100"
                />
              </View>
              {/* C2: Goods Info Card */}
              <View className="flex-row items-center my-4">
                <View className="bg-green-600 w-8 h-8 rounded-full items-center justify-center mr-2 border border-green-200">
                  <Ionicons name="information-circle" size={18} color="#ffffff" />
                </View>
                <Text className="text-green-600 font-JakartaBold text-xl">Thông tin hàng hóa</Text>
              </View>
              <View>
                <InputField
                  label="Tên hàng hóa"
                  labelStyle="text-base text-neutral-600 font-JakartaMedium mb-0"
                  placeholder="Ví dụ: Tủ lạnh, Quần áo..."
                  value={goodsName}
                  onChangeText={setGoodsName}
                />

                <InputField
                  label="Khối lượng (kg)"
                  labelStyle="text-base text-neutral-600 font-JakartaMedium mb-0"
                  placeholder="Nhập cân nặng dự kiến"
                  value={goodsWeight}
                  onChangeText={setGoodsWeight}
                  keyboardType="numeric"
                />

                <TextArea
                  label="Ghi chú thêm"
                  labelStyle="text-base text-neutral-600 font-JakartaMedium mb-0"
                  placeholder="Ví dụ: Hàng dễ vỡ, giao lên tầng 2..."
                  value={note}
                  onChangeText={setNote}
                  numberOfLines={3}
                />

                <Text className="text-lg font-JakartaSemiBold mb-2 text-gray-700">Hình ảnh hàng hóa</Text>
                <View className="flex-row flex-wrap">
                  {images.map((img, idx) => (
                    <View key={idx} className="relative mr-3 mb-4">
                      <Image source={{ uri: img }} className="w-32 h-32 rounded-xl" />
                      <TouchableOpacity
                        className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
                        onPress={() => setImages(images.filter((_, i) => i !== idx))}
                      >
                        <Ionicons name="close" size={12} color="white" />
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity
                    onPress={pickImage}
                    disabled={isUploading}
                    className="w-32 h-32 rounded-xl bg-white border-2 border-dashed border-neutral-300 justify-center items-center"
                  >
                    {isUploading ? (
                      <ActivityIndicator color="#10B981" />
                    ) : (
                      <Ionicons name="camera" size={30} color="#9CA3AF" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* C3: Vehicle Selector */}
              <View className="mt-4 mb-10">
                <Text className="text-lg font-JakartaSemiBold mb-2 text-gray-700">Chọn loại xe</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                  {VEHICLE_TYPES.map((v) => (
                    <TouchableOpacity
                      key={v.id}
                      onPress={() => setSelectedVehicle(v.id)}
                      className={`mr-4 p-4 rounded-2xl border-2 w-32 items-center ${selectedVehicle === v.id ? "border-green-600 bg-green-50" : "border-gray-100 bg-white"
                        }`}
                    >
                      <Ionicons
                        name={v.icon as any}
                        size={32}
                        color={selectedVehicle === v.id ? "#10B981" : "#9CA3AF"}
                      />
                      <Text className={`font-JakartaBold mt-2 ${selectedVehicle === v.id ? "text-green-600" : "text-neutral-500"}`}>
                        {v.title}
                      </Text>
                      <Text className="text-sm text-neutral-400 mt-1">
                        {estimation?.duration || 15} phút
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </>
          }
        />

        {/* C4: Action Button Footer */}
        <View className="p-5 border-t border-gray-100 bg-white shadow-2xl">
          <View className="flex-row justify-between items-center mb-4">
            <View>
              <Text className="text-neutral-500 font-JakartaMedium">Tổng thanh toán</Text>
              <Text className="text-2xl font-JakartaExtraBold text-green-600">
                {isEstimating ? "..." : (estimation?.price || 0).toLocaleString("vi-VN")} VND
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-neutral-400 text-sm">{estimation?.distance || 0} km</Text>
            </View>
          </View>

          <CustomButton
            title={isSubmitting ? "Đang xử lý..." : "Tạo đơn"}
            onPress={handleCreateOrder}
            disabled={isSubmitting || isEstimating}
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

export default BookingSetupScreen;

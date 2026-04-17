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
import { useBookingAI } from "@/hooks/useBookingAI";
import { useStripe } from "@stripe/stripe-react-native";
import * as Location from "expo-location";

const VEHICLE_TYPES = [
  { id: "BIKE", title: "Xe máy", icon: "bicycle", basePrice: 15000 },
  { id: "VAN", title: "Xe tải van", icon: "car-sport", basePrice: 150000 },
  { id: "TRUCK", title: "Xe tải", icon: "car", basePrice: 350000 },
];

const PAYMENT_METHODS = [
  { id: "CASH", title: "Tiền mặt", icon: "cash-outline", color: "#10B981" },
  { id: "WALLET", title: "Ví BenGo", icon: "wallet-outline", color: "#3B82F6" },
  { id: "STRIPE", title: "Thẻ/Stripe", icon: "card-outline", color: "#6366F1" },
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
  const [goodsLength, setGoodsLength] = useState("");
  const [note, setNote] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState(VEHICLE_TYPES[1].id); // Default VAN
  const [selectedPayment, setSelectedPayment] = useState("CASH");
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
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
  const [isLocating, setIsLocating] = useState(false);
  const { uploadImage, isUploading } = useUpload();

  // AI Booking Suggestion
  const {
    suggestion: aiSuggestion,
    isLoading: isAILoading,
    error: aiError,
    getSuggestion: getAISuggestion,
    clearSuggestion: clearAISuggestion,
  } = useBookingAI();

  const handleAISuggest = async () => {
    if (!goodsName.trim()) {
      showAlert("Thiếu thông tin", "Vui lòng nhập tên hàng hóa trước khi sử dụng AI gợi ý.");
      return;
    }
    await getAISuggestion({
      goodsName,
      goodsWeight: goodsWeight || '0',
      goodsLength: goodsLength || '',
      hasImages: images.length > 0,
      imageCount: images.length,
      currentNote: note,
      distance: estimation?.distance,
    });
  };

  const handleAcceptAISuggestion = () => {
    if (aiSuggestion) {
      setSelectedVehicle(aiSuggestion.recommendedVehicle);
      if (aiSuggestion.suggestedNote) {
        setNote(aiSuggestion.suggestedNote);
      }
    }
  };

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
      mediaTypes: ['images'],
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
      // 1. If Stripe, handle payment first
      if (selectedPayment === "STRIPE") {
        const { data: paymentIntent } = await fetchAPI("/(api)/orders/create-payment-intent", {
          method: "POST",
          body: JSON.stringify({
            amount: estimation?.price || 0,
            currency: "vnd",
          }),
        });

        if (!paymentIntent?.client_secret) {
          throw new Error("Không thể khởi tạo thanh toán Stripe.");
        }

        const { error: initError } = await initPaymentSheet({
          paymentIntentClientSecret: paymentIntent.client_secret,
          merchantDisplayName: "BenGo JSC",
        });

        if (initError) {
          throw new Error(initError.message);
        }

        const { error: presentError } = await presentPaymentSheet();
        if (presentError) {
          if (presentError.code === "Canceled") {
            setIsSubmitting(false);
            return;
          }
          throw new Error(presentError.message);
        }
      }

      // 2. Create the order
      const response = await fetchAPI("/(api)/orders", {
        method: "POST",
        body: JSON.stringify({
          origin: { lat: userLatitude, lng: userLongitude, address: userAddress },
          destination: { lat: destinationLatitude, lng: destinationLongitude, address: destinationAddress },
          vehicleType: selectedVehicle,
          goodsImages: images,
          paymentMethod: selectedPayment,
          totalPrice: estimation?.price || 0,
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
        showAlert("Đặt đơn thành công", "Đơn hàng của bạn đang được tìm tài xế.", () => router.push("/(root)/tabs/activities"));
      }
    } catch (error: any) {
      showAlert("Lỗi", error.message || "Không thể tạo đơn hàng lúc này. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        showAlert("Quyền truy cập", "Vui lòng cho phép quyền truy cập vị trí để sử dụng tính năng này.");
        return;
      }

      setIsLocating(true);
      let location = await Location.getCurrentPositionAsync({});
      let address: Location.LocationGeocodedAddress[] = [];

      try {
        address = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } catch (error) {
        console.error("Geocoding error", error);
      }

      const addressString = address && address[0]
        ? `${address[0].name ? address[0].name + ", " : ""}${address[0].street ? address[0].street + ", " : ""}${address[0].district ? address[0].district + ", " : ""}${address[0].city || address[0].region || ""}`.replace(/^, |, $/, "")
        : `Vị trí (${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)})`;

      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address: addressString,
      });
    } catch (error) {
      showAlert("Lỗi", "Không thể lấy vị trí hiện tại. Vui lòng kiểm tra GPS.");
    } finally {
      setIsLocating(false);
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
              <View className="flex-row items-center mt-4 mb-2">
                <View className="bg-green-600 w-7 h-7 rounded-full items-center justify-center mr-2 border border-green-200">
                  <Ionicons name="location-sharp" size={14} color="#ffffff" />
                </View>
                <Text className="text-green-600 font-JakartaBold text-xl">Chọn địa điểm</Text>
              </View>
              {/* Pickup Section */}
              <View className="mb-4" style={{ zIndex: 10 }}>
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-lg font-JakartaSemiBold text-gray-700">Điểm lấy hàng</Text>
                  <TouchableOpacity
                    onPress={handleSelectCurrentLocation}
                    disabled={isLocating}
                    className="flex-row items-center bg-green-600 px-3 py-1.5 rounded-full border border-green-100"
                  >
                    {isLocating ? (
                      <ActivityIndicator size="small" color="#10B981" />
                    ) : (
                      <>
                        <Ionicons name="location" size={14} color="#ffffff" />
                        <Text className="text-white font-JakartaBold text-xs ml-1">Vị trí hiện tại</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
                <GoogleTextInput
                  initialLocation={userAddress || ""}
                  handlePress={(location) => setUserLocation(location)}
                  containerStyle="bg-gray-100"
                  userLatitude={userLatitude}
                  userLongitude={userLongitude}
                />
              </View>
              {/* Dropoff Section */}
              <View style={{ zIndex: 5 }}>
                <Text className="text-lg font-JakartaSemiBold mb-2 text-gray-700">Điểm giao hàng</Text>
                <GoogleTextInput
                  initialLocation={destinationAddress || ""}
                  handlePress={(location) => setDestinationLocation(location)}
                  containerStyle="bg-gray-100"
                  userLatitude={userLatitude}
                  userLongitude={userLongitude}
                />
              </View>
              {/* C2: Goods Info Card */}
              <View className="flex-row items-center mt-4 mb-2">
                <View className="bg-green-600 w-7 h-7 rounded-full items-center justify-center mr-2 border border-green-200">
                  <Ionicons name="information-circle" size={14} color="#ffffff" />
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

                <InputField
                  label="Kích thước / Chiều dài (Tùy chọn)"
                  labelStyle="text-base text-neutral-600 font-JakartaMedium mb-0"
                  placeholder="Ví dụ: 1.9m x 0.7m hoặc ~60cm"
                  value={goodsLength}
                  onChangeText={setGoodsLength}
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

              {/* AI Suggestion Section */}
              <View className="mt-4 mb-2">
                <TouchableOpacity
                  onPress={handleAISuggest}
                  disabled={isAILoading}
                  className={`flex-row items-center justify-center py-3 rounded-2xl border-2 border-dashed ${isAILoading ? 'border-gray-200 bg-gray-50' : 'border-green-300 bg-green-50'
                    }`}
                >
                  {isAILoading ? (
                    <>
                      <ActivityIndicator color="#9333EA" size="small" />
                      <Text className="text-green-600 font-JakartaBold text-base ml-2">
                        AI đang phân tích hàng hóa...
                      </Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="sparkles" size={20} color="#9333EA" />
                      <Text className="text-green-600 font-JakartaBold text-base ml-2">
                        AI Gợi ý loại xe & ghi chú
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* AI Error */}
                {aiError && (
                  <View className="mt-2 bg-red-50 border border-red-200 p-3 rounded-xl flex-row items-start">
                    <Ionicons name="alert-circle" size={16} color="#EF4444" />
                    <Text className="text-red-600 text-sm font-Jakarta ml-2 flex-1">{aiError}</Text>
                  </View>
                )}

                {/* AI Suggestion Card */}
                {aiSuggestion && !isAILoading && (
                  <View
                    className="mt-3 bg-white rounded-2xl p-4 border border-green-200"
                  >
                    {/* Header */}
                    <View className="flex-row items-center mb-3">
                      <View className="w-8 h-8 bg-green-50 rounded-lg items-center justify-center mr-2">
                        <Ionicons name="sparkles" size={16} color="#16a34a" />
                      </View>
                      <Text className="text-green-600 font-JakartaBold text-base">Gợi ý từ AI</Text>
                    </View>

                    {/* Vehicle recommendation + Lý do chọn xe */}
                    <View className="bg-green-50 rounded-xl p-3 mb-3 border border-green-600">
                      {/* Header: Icon xe + Tên xe đề xuất */}
                      <View className="flex-row items-center mb-2">
                        <View className="w-9 h-9 bg-green-600 rounded-xl items-center justify-center mr-2">
                          <Ionicons
                            name={VEHICLE_TYPES.find(v => v.id === aiSuggestion.recommendedVehicle)?.icon as any || "car"}
                            size={20}
                            color="#fff"
                          />
                        </View>
                        <Text className="text-green-600 font-JakartaBold text-base">Loại xe được đề xuất:  {VEHICLE_TYPES.find(v => v.id === aiSuggestion.recommendedVehicle)?.title || aiSuggestion.recommendedVehicle}</Text>
                      </View>

                      {/* Divider */}
                      <View className="h-px bg-green-600 opacity-20 mb-2 mx-1" />

                      {/* Lý do phân tích */}
                      <Text className="text-green-600 text-base font-Jakarta leading-5 mb-2">
                        {aiSuggestion.vehicleReason}
                      </Text>

                      {/* Thông số - ưu tiên dùng số liệu người dùng đã nhập */}
                      {(goodsWeight || goodsLength || aiSuggestion.estimatedWeight || aiSuggestion.estimatedLength) ? (
                        <View className="bg-white rounded-lg p-2 py-3 flex-row flex-wrap">
                          {/* Khối lượng: dùng số người dùng nhập, fallback về AI estimate */}
                          {(goodsWeight || aiSuggestion.estimatedWeight) ? (
                            <View className="flex-row items-center mr-4">
                              <Text className="text-gray-400 text-sm font-Jakarta">⚖️ </Text>
                              <Text className="text-gray-600 text-sm font-JakartaMedium">
                                {goodsWeight ? `${goodsWeight} kg` : aiSuggestion.estimatedWeight}
                              </Text>
                            </View>
                          ) : null}
                          {/* Kích thước: dùng số người dùng nhập, fallback về AI estimate */}
                          {(goodsLength || aiSuggestion.estimatedLength) ? (
                            <View className="flex-row items-center">
                              <Text className="text-gray-400 text-sm font-Jakarta">📐 </Text>
                              <Text className="text-gray-600 text-sm font-JakartaMedium">
                                {goodsLength || aiSuggestion.estimatedLength}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      ) : null}
                    </View>

                    {/* Suggested note */}
                    {aiSuggestion.suggestedNote ? (
                      <View className="bg-green-50 rounded-xl p-3 mb-3 border border-green-600 border-dashed">
                        <View className="flex-row items-center mb-2">
                          <View className="w-9 h-9 bg-green-600 rounded-xl items-center justify-center mr-2">
                            <Ionicons name="document-text-outline"
                              size={20}
                              color="#fff" />
                          </View>
                          <Text className="text-green-600 font-JakartaBold text-base">Ghi chú gợi ý cho tài xế</Text>
                        </View>
                        <Text className="text-green-600 text-base font-Jakarta">
                          {aiSuggestion.suggestedNote}
                        </Text>
                      </View>
                    ) : null}

                    {/* Tips */}
                    {aiSuggestion.tips && aiSuggestion.tips.length > 0 && (
                      <View className="mb-3">
                        {aiSuggestion.tips.map((tip, idx) => (
                          <View key={idx} className="flex-row items-start mb-1">
                            <Text className="text-green-600 text-base mr-1.5 font-JakartaBold">💡</Text>
                            <Text className="text-green-600 text-base font-Jakarta flex-1">{tip}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Accept button */}
                    <CustomButton
                      title="Áp dụng gợi ý: Chọn xe & Điền ghi chú"
                      onPress={handleAcceptAISuggestion}
                      className="bg-green-600"
                      IconLeft={() => <Ionicons name="checkmark-circle" size={18} color="white" />}
                    />
                  </View>
                )}
              </View>

              {/* C3: Vehicle Selector */}
              <View className="mb-4">
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

              {/* C4: Payment Selector */}
              <View className="mb-4">
                <Text className="text-lg font-JakartaSemiBold mb-2 text-gray-700">Phương thức thanh toán</Text>
                <View className="bg-white rounded-2xl overflow-hidden border border-gray-100">
                  {PAYMENT_METHODS.map((pm, idx) => (
                    <TouchableOpacity
                      key={pm.id}
                      onPress={() => setSelectedPayment(pm.id)}
                      className={`flex-row items-center p-4 border-b border-gray-50 last:border-b-0 ${selectedPayment === pm.id ? "bg-green-50" : ""
                        }`}
                    >
                      <View className="w-10 h-10 rounded-full items-center justify-center mr-4" style={{ backgroundColor: pm.color + "15" }}>
                        <Ionicons name={pm.icon as any} size={20} color={pm.color} />
                      </View>
                      <Text className={`flex-1 font-JakartaMedium ${selectedPayment === pm.id ? "text-green-700" : "text-gray-600"}`}>
                        {pm.title}
                      </Text>
                      {selectedPayment === pm.id && (
                        <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          }
        />

        {/* C4: Action Button Footer */}
        <View className="p-5 border-t border-gray-100 bg-white">
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
            title={isSubmitting ? "Đang xử lý..." : "Xác nhận đặt đơn"}
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

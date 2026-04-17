import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Image, Linking, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import MapDirections from 'react-native-maps-directions';
import * as Location from 'expo-location';

import { useDriverOrderDetail, useDriverUpdateOrderStatus } from '@/hooks/useDriver';
import CustomButton from '@/components/Common/CustomButton';
import CustomModal from '@/components/Common/CustomModal';

const GOOGLE_MAPS_APIKEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY || '';

const ActiveTripScreen = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const mapRef = useRef<MapView>(null);

  const { data: order, isLoading } = useDriverOrderDetail(id as string);
  const { mutateAsync: updateStatus, isPending } = useDriverUpdateOrderStatus();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);

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
    let locationSubscription: Location.LocationSubscription;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      locationSubscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 10, timeInterval: 5000 },
        (loc) => {
          setLocation(loc);
        }
      );
    })();

    return () => {
      if (locationSubscription) locationSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (order && location && mapRef.current) {
      const target = order.status === 'ACCEPTED' ? order.pickup : order.dropoff;
      mapRef.current.fitToCoordinates([
        { latitude: location.coords.latitude, longitude: location.coords.longitude },
        { latitude: target.lat, longitude: target.lng }
      ], {
        edgePadding: { top: 100, right: 50, bottom: 350, left: 50 },
        animated: true,
      });
    }
  }, [order?.status, location]);

  if (isLoading || !order) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#10B981" />
        <Text className="mt-4 text-gray-500 font-Jakarta">Đang tải thông tin chuyến đi...</Text>
      </View>
    );
  }

  // Derived state
  const isHeadingToPickup = order.status === 'ACCEPTED';
  const isHeadingToDropoff = order.status === 'PICKED_UP';
  const isCompleted = order.status === 'DELIVERED';

  const driverCoord = location ? { latitude: location.coords.latitude, longitude: location.coords.longitude } : { latitude: order.pickup.lat, longitude: order.pickup.lng };
  const targetCoord = isHeadingToPickup ? { latitude: order.pickup.lat, longitude: order.pickup.lng } : { latitude: order.dropoff.lat, longitude: order.dropoff.lng };

  const handleSwipeSuccess = async () => {
    try {
      if (isHeadingToPickup) {
        await updateStatus({ id: id as string, status: 'PICKED_UP' });
      } else if (isHeadingToDropoff) {
        // Rederect to delivery proof screen instead of completing
        router.push(`/(driver)/active-trip/delivery-proof/${id}`);
      }
    } catch (error) {
      showAlert('Lỗi', 'Không thể cập nhật trạng thái');
    }
  };

  const currentStep = isHeadingToPickup ? 1 : isHeadingToDropoff ? 2 : 3;

  return (
    <SafeAreaView className="flex-1 bg-gray-100" edges={["top", "bottom"]}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Map Section */}
        <View className="relative" style={{ height: 400 }}>
          <MapView
            ref={mapRef}
            style={{ flex: 1 }}
            initialRegion={{
              ...driverCoord,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
            showsUserLocation={false}
          >
            {location && (
              <Marker coordinate={driverCoord} anchor={{ x: 0.5, y: 0.5 }}>
                <View className="bg-gray-100 p-1 rounded-full shadow-lg border-2 border-green-500">
                  <Ionicons name="car" size={20} color="#10B981" />
                </View>
              </Marker>
            )}

            {!isCompleted && (
              <Marker coordinate={targetCoord}>
                <View className="bg-gray-100 p-1 rounded-full shadow-lg border-2 border-blue-500">
                  <Ionicons name={isHeadingToPickup ? 'radio-button-on' : 'pin'} size={20} color="#3B82F6" />
                </View>
              </Marker>
            )}

            {!isCompleted && location && GOOGLE_MAPS_APIKEY && (
              <MapDirections
                origin={driverCoord}
                destination={targetCoord}
                apikey={GOOGLE_MAPS_APIKEY}
                strokeWidth={4}
                strokeColor="#3B82F6"
                optimizeWaypoints={true}
              />
            )}
          </MapView>

          {/* Back Button Overlay */}
          <TouchableOpacity
            className="absolute top-4 left-4 w-10 h-10 bg-white rounded-full items-center justify-center shadow-lg"
            onPress={() => router.replace('/(driver)/tabs/home')}
          >
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </TouchableOpacity>

          {/* Progress Timeline Overlay */}
          <View className="absolute top-4 left-16 right-10 bg-white rounded-2xl px-2 py-3 shadow-lg">
            <View className="flex-row items-center px-2">
              {/* Step 1 */}
              <View className="items-center">
                <Ionicons name="ellipse" size={18} color="#10B981" />
              </View>

              {/* Line 1-2 */}
              <View className={`h-1 flex-1 mx-[-2px] ${currentStep > 1 ? 'bg-green-500' : 'bg-gray-200'}`} />

              {/* Step 2 */}
              <View className="items-center">
                <Ionicons
                  name={currentStep > 1 ? "checkmark-circle" : "ellipse-outline"}
                  size={18}
                  color={currentStep > 1 ? "#10B981" : "#D1D5DB"}
                />
              </View>

              {/* Line 2-3 */}
              <View className={`h-1 flex-1 mx-[-2px] ${currentStep > 2 ? 'bg-green-500' : 'bg-gray-200'}`} />

              {/* Step 3 */}
              <View className="items-center">
                <Ionicons
                  name={currentStep > 2 ? "checkmark-circle" : "ellipse-outline"}
                  size={18}
                  color={currentStep > 2 ? "#10B981" : "#D1D5DB"}
                />
              </View>
            </View>

            {/* Labels Row */}
            <View className="flex-row justify-between mt-2 px-1">
              <Text className="text-[10px] text-nowrap font-JakartaBold text-gray-700 w-16 text-center">Lấy hàng</Text>
              <Text className={`text-[10px] text-nowrap font-JakartaBold w-16 text-center ${currentStep > 1 ? 'text-green-600' : 'text-gray-500'}`}>Đang giao</Text>
              <Text className={`text-[10px] text-nowrap font-JakartaBold w-16 text-center ${currentStep > 2 ? 'text-green-600' : 'text-gray-500'}`}>Đã giao</Text>
            </View>
          </View>
        </View>

        {/* Bottom Information Card */}
        <View
          className="bg-white rounded-t-3xl p-4"
          style={{ shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10, marginTop: -20 }}
        >
          {/* Customer Info */}
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center flex-1">
              <View className="w-14 h-14 bg-gray-100 rounded-full items-center justify-center mr-3 overflow-hidden">
                <Image source={{ uri: `https://api.dicebear.com/9.x/avataaars/png?seed=${order.customer?.name || 'Customer'}` }} className="w-full h-full" />
              </View>
              <View>
                <Text className="text-gray-700 font-JakartaBold">Khách hàng: {order.customer?.name || 'Khách hàng'}</Text>
                <View className="flex-row items-center mt-1">
                  <Ionicons name="star" size={14} color="#F59E0B" />
                  <Text className="text-gray-700 font-JakartaSemiBold text-sm ml-1">5.0</Text>
                </View>
              </View>
            </View>
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="w-12 h-12 items-center justify-center bg-green-50 rounded-full border border-green-200"
                onPress={() => Linking.openURL(`tel:${order.customer?.phone}`)}
              >
                <Ionicons name="call" size={20} color="#10B981" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Body: Timeline */}
          <View className="mb-4 px-1">
            <View className="flex-row items-start">
              <View className="items-center mr-4 pt-1.5">
                <View className="w-5 h-5 rounded-full border-2 border-green-500 bg-white items-center justify-center">
                  <View className="w-2 h-2 rounded-full bg-green-500" />
                </View>
                <View className="w-[1px] h-16 bg-gray-200 my-1 border-dashed" />
                <View className="w-5 h-5 rounded-full border-2 border-red-500 bg-white items-center justify-center">
                  <View className="w-2 h-2 rounded-full bg-red-500" />
                </View>
              </View>

              <View className="flex-1">
                <View className="mb-4">
                  <Text className="text-gray-500 font-JakartaBold mb-1">
                    Điểm đón
                  </Text>
                  <Text
                    className="text-gray-700 font-JakartaBold"
                    numberOfLines={2}
                  >
                    {order?.pickup?.address || "Không xác định"}
                  </Text>
                </View>
                <View>
                  <Text className="text-gray-500 font-JakartaBold mb-1">
                    Điểm giao
                  </Text>
                  <Text
                    className="text-gray-700 font-JakartaBold"
                    numberOfLines={2}
                  >
                    {order?.dropoff?.address || "Không xác định"}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Order Details: Financial & Goods */}
          <View className="flex-row justify-between mb-4 bg-gray-50 p-4 rounded-2xl">
            <View>
              <Text className="text-sm text-gray-400 font-JakartaBold uppercase mb-1">Phí cước</Text>
              <Text className="text-base font-JakartaBold text-green-600">{order.totalPrice?.toLocaleString('vi-VN')}đ</Text>
            </View>
            <View className="items-center">
              <Text className="text-sm text-gray-400 font-JakartaBold uppercase mb-1">Khoảng cách</Text>
              <Text className="text-base font-JakartaBold text-gray-700">{order.distanceKm} km</Text>
            </View>
            <View className="items-end">
              <Text className="text-sm text-gray-400 font-JakartaBold uppercase mb-1">Thanh toán</Text>
              <Text className="text-base font-JakartaBold text-gray-700">{order.paymentMethod === 'CASH' ? 'Tiền mặt' : 'Ví điện tử'}</Text>
            </View>
          </View>

          {order.goodsImages && order.goodsImages.length > 0 && (
            <View className="mb-4">
              <Text className="text-lg font-JakartaSemiBold mb-2 text-gray-700">Hình ảnh hàng hóa</Text>
              <View className="flex-row">
                {order.goodsImages.slice(0, 4).map((img, idx) => (
                  <Image key={idx} source={{ uri: img }} className="w-32 h-32 rounded-xl" />
                ))}
              </View>
            </View>
          )}

          {/* Action Button Area */}
          {!isCompleted ? (
            <CustomButton
              title={isHeadingToPickup ? "Xác nhận đã lấy hàng" : "Xác nhận đã giao hàng"}
              onPress={handleSwipeSuccess}
              loading={isPending}
              IconLeft={() => <Ionicons name={isHeadingToPickup ? "cube" : "checkmark-done"} size={20} color="white" />}
            />
          ) : (
            <CustomButton
              title="Hoàn thành chuyến đi"
              onPress={() => router.replace('/(driver)/tabs/orders')}
              IconLeft={() => <Ionicons name="checkmark-circle" size={20} color="white" />}
            />
          )}
        </View>
      </ScrollView>


      <CustomModal
        visible={alertModal.visible}
        title={alertModal.title}
        message={alertModal.message}
        onClose={closeAlert}
      />
    </SafeAreaView>
  );
};

export default ActiveTripScreen;

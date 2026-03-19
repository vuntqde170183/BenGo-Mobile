import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Image, Linking, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import MapDirections from 'react-native-maps-directions';
import * as Location from 'expo-location';

import { useDriverOrderDetail, useDriverUpdateOrderStatus } from '@/hooks/useDriver';
import SwipeButton from '@/components/Common/SwipeButton';

const GOOGLE_MAPS_APIKEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY || '';

const ActiveTripScreen = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const mapRef = useRef<MapView>(null);

  const { data: order, isLoading } = useDriverOrderDetail(id as string);
  const { mutateAsync: updateStatus, isPending } = useDriverUpdateOrderStatus();

  const [location, setLocation] = useState<Location.LocationObject | null>(null);

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
        await updateStatus({ id: id as string, status: 'DELIVERED' });
        Alert.alert('Thành công', 'Chuyến đi đã hoàn thành!', [
          { text: 'Về trang chủ', onPress: () => router.replace('/(driver)/tabs/home') }
        ]);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái');
    }
  };

  const currentStep = isHeadingToPickup ? 1 : isHeadingToDropoff ? 2 : 3;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      {/* Map Section */}
      <View className="flex-1 relative">
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
              <View className="bg-white p-2 rounded-full shadow-lg border-2 border-green-500">
                <Ionicons name="car" size={20} color="#10B981" />
              </View>
            </Marker>
          )}

          {!isCompleted && (
            <Marker coordinate={targetCoord}>
              <View className="bg-white p-2 rounded-full shadow-lg border-2 border-blue-500">
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
        <View className="absolute top-4 mx-16 bg-white rounded-2xl p-3 shadow-lg flex-row items-center justify-between">
          <View className="items-center flex-1">
            <Ionicons name="ellipse" size={20} color="#10B981" />
            <Text className="text-[10px] font-JakartaBold text-gray-700 mt-1">Đón khách</Text>
          </View>
          <View className={`h-0.5 flex-1 ${currentStep > 1 ? 'bg-green-500' : 'bg-gray-200'}`} />
          <View className="items-center flex-1">
            <Ionicons name={currentStep > 1 ? "checkmark-circle" : "ellipse-outline"} size={20} color={currentStep > 1 ? "#10B981" : "#D1D5DB"} />
            <Text className={`text-[10px] font-JakartaBold mt-1 ${currentStep > 1 ? 'text-green-600' : 'text-gray-400'}`}>Đã lấy hàng</Text>
          </View>
          <View className={`h-0.5 flex-1 ${currentStep > 2 ? 'bg-green-500' : 'bg-gray-200'}`} />
          <View className="items-center flex-1">
            <Ionicons name={currentStep > 2 ? "checkmark-circle" : "ellipse-outline"} size={20} color={currentStep > 2 ? "#10B981" : "#D1D5DB"} />
            <Text className={`text-[10px] font-JakartaBold mt-1 ${currentStep > 2 ? 'text-green-600' : 'text-gray-400'}`}>Hoàn thành</Text>
          </View>
        </View>
      </View>

      {/* Bottom Information Card */}
      <View
        className="bg-white rounded-t-3xl pt-6 px-5 pb-8"
        style={{ shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10, marginTop: -20 }}
      >
        {/* Customer Info */}
        <View className="flex-row justify-between items-center mb-6">
          <View className="flex-row items-center flex-1">
            <View className="w-14 h-14 bg-gray-100 rounded-full items-center justify-center mr-3 overflow-hidden">
              <Image source={{ uri: `https://api.dicebear.com/9.x/avataaars/png?seed=${order.customerId?.name || 'Customer'}` }} className="w-full h-full" />
            </View>
            <View>
              <Text className="text-gray-700 font-JakartaBold text-lg">{order.customerId?.name || 'Khách hàng'}</Text>
              <View className="flex-row items-center mt-1">
                <Ionicons name="star" size={14} color="#F59E0B" />
                <Text className="text-gray-700 font-JakartaSemiBold text-xs ml-1">5.0</Text>
              </View>
            </View>
          </View>
          <View className="flex-row gap-3">
            <TouchableOpacity
              className="w-12 h-12 rounded-full bg-blue-50 items-center justify-center"
              onPress={() => Alert.alert("Sắp ra mắt", "Chức năng nhắn tin đang được phát triển")}
            >
              <Ionicons name="chatbubbles" size={24} color="#3B82F6" />
            </TouchableOpacity>
            <TouchableOpacity
              className="w-12 h-12 rounded-full bg-green-50 items-center justify-center"
              onPress={() => Linking.openURL(`tel:${order.customerId?.phone}`)}
            >
              <Ionicons name="call" size={24} color="#10B981" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Location Info */}
        <View className="bg-gray-50 rounded-2xl p-4 mb-6 relative">
          <View className="flex-row items-start mb-4">
            <View className="mt-1 mr-3 w-5 items-center">
              <Ionicons name="radio-button-on" size={20} color="#3B82F6" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-500 font-Jakarta text-xs mb-1 uppercase tracking-wider">Từ</Text>
              <Text className="text-gray-700 font-JakartaSemiBold text-[15px]">{order.pickup.address}</Text>
            </View>
          </View>

          <View className="absolute left-[23px] top-[34px] w-[2px] h-[34px] bg-gray-200" />

          <View className="flex-row items-start">
            <View className="mt-1 mr-3 w-5 items-center">
              <Ionicons name="pin" size={20} color="#DC2626" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-500 font-Jakarta text-xs mb-1 uppercase tracking-wider">Đến</Text>
              <Text className="text-gray-700 font-JakartaSemiBold text-[15px]">{order.dropoff.address}</Text>
            </View>
          </View>
        </View>

        {/* Swipe Button Area */}
        {isPending ? (
          <View className="h-[56px] justify-center items-center bg-gray-100 rounded-full">
            <ActivityIndicator color="#10B981" />
          </View>
        ) : !isCompleted ? (
          <SwipeButton
            title={isHeadingToPickup ? "VUỐT ĐỂ LẤY HÀNG" : "VUỐT ĐỂ GIAO HÀNG"}
            color={isHeadingToPickup ? "#F97316" : "#3B82F6"} // Orange for pickup, Blue for delivery
            onSwipeSuccess={handleSwipeSuccess}
          />
        ) : (
          <TouchableOpacity
            className="h-[56px] justify-center items-center bg-green-500 rounded-full"
            onPress={() => router.replace('/(driver)/tabs/home')}
          >
            <Text className="text-white font-JakartaBold text-base">HOÀN THÀNH CHUYẾN ĐI</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

export default ActiveTripScreen;

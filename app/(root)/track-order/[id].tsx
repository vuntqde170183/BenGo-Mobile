import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Linking,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { useOrderDetails } from "@/hooks/useOrders";
import { OrderStatus } from "@/api/orders";

const { width, height } = Dimensions.get("window");

const TrackOrderScreen = () => {
  const { id } = useLocalSearchParams();
  // Polling every 10 seconds to get driver's current position
  const { data: order, isLoading: loading, refetch } = useOrderDetails(id as string);

  const bottomSheetRef = useRef<BottomSheet>(null);
  const mapRef = useRef<MapView>(null);

  const snapPoints = useMemo(() => ["35%", "60%"], []);

  // Effect for polling
  useEffect(() => {
    const interval = setInterval(() => {
        if (order && (order.status === 'ACCEPTED' || order.status === 'PICKED_UP')) {
            refetch();
        }
    }, 10000); 
    return () => clearInterval(interval);
  }, [order?.status]);

  useEffect(() => {
    if (order && mapRef.current) {
      const points = [
        { latitude: Number(order.pickup.lat), longitude: Number(order.pickup.lng) },
        { latitude: Number(order.dropoff.lat), longitude: Number(order.dropoff.lng) }
      ];
      
      const driverPos = order.driver?.currentLocation || order.driverId?.currentLocation;
      if (driverPos) {
        points.push({
          latitude: Number(driverPos.lat),
          longitude: Number(driverPos.lng)
        });
      }

      mapRef.current.fitToCoordinates(points, {
        edgePadding: { top: 150, right: 50, bottom: height * 0.4, left: 50 },
        animated: true,
      });
    }
  }, [order?.status, order?.driver?.currentLocation, order?.driverId?.currentLocation]);

  const handleCall = () => {
    const phone = order?.driver?.phone || order?.driverId?.phone;
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const renderStatusTimeline = () => {
    const statuses: { label: string; key: OrderStatus[] }[] = [
      { label: "Đã nhận", key: ["ACCEPTED", "PICKED_UP", "DELIVERED"] },
      { label: "Lấy hàng", key: ["PICKED_UP", "DELIVERED"] },
      { label: "Đang giao", key: ["PICKED_UP", "DELIVERED"] },
      { label: "Xong", key: ["DELIVERED"] },
    ];

    const currentStatusIndex = statuses.findIndex(s => s.key.includes(order?.status || "PENDING"));

    return (
      <View className="flex-row items-center justify-between px-6 py-4 bg-white/95 rounded-3xl mx-4 shadow-xl border border-gray-100">
        {statuses.map((step, index) => {
            const isActive = index <= currentStatusIndex;
            return (
                <View key={index} className="flex-1 items-center">
                    <View className="flex-row items-center w-full">
                        <View className={`h-[2px] flex-1 ${index === 0 ? 'bg-transparent' : (isActive ? 'bg-green-500' : 'bg-gray-200')}`} />
                        <View className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <View className={`h-[2px] flex-1 ${index === statuses.length - 1 ? 'bg-transparent' : (index < currentStatusIndex ? 'bg-green-500' : 'bg-gray-200')}`} />
                    </View>
                    <Text className={`text-[10px] mt-1 font-JakartaBold ${isActive ? 'text-green-600' : 'text-gray-400'}`}>
                        {step.label}
                    </Text>
                </View>
            );
        })}
      </View>
    );
  };

  if (loading && !order) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  if (!order) {
    return (
      <View className="flex-1 justify-center items-center bg-white p-4">
        <Text className="text-lg font-JakartaBold text-gray-700">Không tìm thấy đơn hàng</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4 bg-green-500 px-6 py-3 rounded-full shadow-lg">
          <Text className="text-white font-JakartaBold">Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const driver = order.driver || order.driverId;
  const isHeadingToPickup = order.status === 'ACCEPTED';
  const isHeadingToDropoff = order.status === 'PICKED_UP';

  return (
    <View className="flex-1 bg-white">
      {/* Map Content */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={{ flex: 1 }}
        initialRegion={{
          latitude: Number(order.pickup.lat),
          longitude: Number(order.pickup.lng),
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        <Marker coordinate={{ latitude: Number(order.pickup.lat), longitude: Number(order.pickup.lng) }}>
            <View className="bg-white p-1 rounded-full shadow-lg border-2 border-blue-500">
                <Ionicons name="radio-button-on" size={20} color="#3B82F6" />
            </View>
        </Marker>

        <Marker coordinate={{ latitude: Number(order.dropoff.lat), longitude: Number(order.dropoff.lng) }}>
            <View className="bg-white p-1 rounded-full shadow-lg border-2 border-red-500">
                <Ionicons name="location" size={20} color="#EF4444" />
            </View>
        </Marker>

        {driver?.currentLocation && (
          <Marker
            coordinate={{
              latitude: Number(driver.currentLocation.lat),
              longitude: Number(driver.currentLocation.lng)
            }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View className="bg-white p-1.5 rounded-full shadow-2xl border-2 border-green-500">
              <Ionicons name="car" size={24} color="#10B981" />
            </View>
          </Marker>
        )}

        {/* Driving Route: Driver to Pickup (If haven't picked up) */}
        {driver?.currentLocation && isHeadingToPickup && (
          <MapViewDirections
            origin={{ latitude: Number(driver.currentLocation.lat), longitude: Number(driver.currentLocation.lng) }}
            destination={{ latitude: Number(order.pickup.lat), longitude: Number(order.pickup.lng) }}
            apikey={process.env.EXPO_PUBLIC_GOOGLE_API_KEY || ""}
            strokeWidth={4}
            strokeColor="#3B82F6"
          />
        )}

        {/* Goods Route: Pickup to Dropoff (Standard Route) */}
        <MapViewDirections
          origin={{ latitude: Number(order.pickup.lat), longitude: Number(order.pickup.lng) }}
          destination={{ latitude: Number(order.dropoff.lat), longitude: Number(order.dropoff.lng) }}
          apikey={process.env.EXPO_PUBLIC_GOOGLE_API_KEY || ""}
          strokeWidth={4}
          strokeColor={isHeadingToDropoff ? "#10B981" : "#D1D5DB"}
        />
      </MapView>

      {/* Floating Header Controls */}
      <SafeAreaView className="absolute top-0 left-0 right-0 z-10 px-4 pt-2">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-xl border border-gray-100"
          >
            <Ionicons name="chevron-back" size={28} color="#111827" />
          </TouchableOpacity>
          
          <View className="bg-white px-5 py-3 rounded-full shadow-xl border border-gray-100">
            <Text className="font-JakartaExtraBold text-gray-800">
                {isHeadingToPickup ? "Tài xế đang đến lấy hàng" : isHeadingToDropoff ? "Đang giao hàng" : "Chờ xác nhận"}
            </Text>
          </View>

          <View className="w-12" />
        </View>

        <View className="mt-4">
            {renderStatusTimeline()}
        </View>
      </SafeAreaView>

      {/* Driver Info Bottom Sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        handleIndicatorStyle={{ backgroundColor: "#E5E7EB", width: 40 }}
        backgroundStyle={{ borderRadius: 32, backgroundColor: 'white' }}
      >
        <BottomSheetView className="flex-1 px-5 pt-4">
          <View className="flex-row items-center justify-between border-b border-gray-100 pb-5">
            <View className="flex-row items-center flex-1">
              <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mr-4 overflow-hidden border-2 border-green-50">
                <Image
                  source={{ uri: driver?.avatar || `https://api.dicebear.com/9.x/avataaars/png?seed=${driver?.name || 'Driver'}` }}
                  className="w-full h-full"
                />
              </View>
              <View className="flex-1">
                <Text className="text-xl font-JakartaBold text-gray-800" numberOfLines={1}>{driver?.name || "Đang chờ tài xế..."}</Text>
                <Text className="text-gray-500 font-JakartaMedium">{driver?.licensePlate || "BenGo Driver App"}</Text>
                <View className="flex-row items-center mt-1">
                  <Ionicons name="star" size={16} color="#FBBF24" />
                  <Text className="ml-1 text-sm font-JakartaBold text-gray-700">{driver?.rating || 5.0}</Text>
                </View>
              </View>
            </View>

            {driver && (
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={handleCall}
                  className="w-12 h-12 bg-green-50 rounded-full items-center justify-center border border-green-100"
                >
                  <Ionicons name="call" size={24} color="#10B981" />
                </TouchableOpacity>
                <TouchableOpacity
                  className="w-12 h-12 bg-blue-50 rounded-full items-center justify-center border border-blue-100"
                >
                  <Ionicons name="chatbubbles" size={24} color="#3B82F6" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View className="mt-4">
            <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-JakartaBold text-gray-800">Thông tin lộ trình</Text>
                <View className="bg-green-50 px-3 py-1 rounded-full">
                    <Text className="text-green-600 font-JakartaBold text-xs">{order.distanceKm} km</Text>
                </View>
            </View>

            <View className="flex-row items-start">
              <View className="items-center mr-4 pt-1.5">
                <View className="w-3 h-3 rounded-full bg-blue-500" />
                <View className="w-[1px] h-12 bg-gray-200 my-1" />
                <View className="w-3 h-3 rounded-full bg-red-500" />
              </View>
              <View className="flex-1">
                <View className="mb-4">
                  <Text className="text-xs text-gray-400 font-JakartaBold uppercase mb-1">Điểm lấy hàng</Text>
                  <Text className="text-[15px] font-JakartaSemiBold text-gray-700" numberOfLines={2}>{order.pickup.address}</Text>
                </View>
                <View>
                  <Text className="text-xs text-gray-400 font-JakartaBold uppercase mb-1">Điểm giao hàng</Text>
                  <Text className="text-[15px] font-JakartaSemiBold text-gray-700" numberOfLines={2}>{order.dropoff.address}</Text>
                </View>
              </View>
            </View>
          </View>

          <View className="mt-8 flex-row justify-between items-center bg-gray-50 p-4 rounded-2xl">
            <View>
                <Text className="text-xs text-gray-400 font-JakartaBold uppercase mb-1">Tổng phí cước</Text>
                <Text className="text-2xl font-JakartaExtraBold text-green-600">
                  {order.totalPrice.toLocaleString("vi-VN")}đ
                </Text>
            </View>
            <View className="items-end">
                <Text className="text-xs text-gray-400 font-JakartaBold uppercase mb-1">Thanh toán</Text>
                <Text className="text-gray-700 font-JakartaBold uppercase">{order.paymentMethod === 'CASH' ? 'Tiền mặt' : 'Ví BenGo'}</Text>
            </View>
          </View>

          {order.status === "DELIVERED" && (
            <TouchableOpacity
              onPress={() => router.replace(`/(root)/order-detail/${id}` as any)}
              className="mt-6 bg-green-500 py-4 rounded-2xl items-center shadow-lg active:bg-green-600"
            >
              <Text className="text-white font-JakartaExtraBold text-lg">XEM CHI TIẾT & THANH TOÁN</Text>
            </TouchableOpacity>
          )}
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
};

export default TrackOrderScreen;

import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Linking,
  Platform,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { fetchAPI } from "@/lib/fetch";
import { icons } from "@/constants";

const { width, height } = Dimensions.get("window");

import { useOrderDetails } from "@/hooks/useOrders";
import { OrderStatus } from "@/api/orders";

const TrackOrderScreen = () => {
  const { id } = useLocalSearchParams();
  const { data: order, isLoading: loading } = useOrderDetails(id as string);

  const bottomSheetRef = useRef<BottomSheet>(null);
  const mapRef = useRef<MapView>(null);

  const snapPoints = useMemo(() => ["35%", "50%"], []);

  useEffect(() => {
    if (order && mapRef.current) {
      // Center map between points
      const points = [
        { latitude: order.pickup.lat, longitude: order.pickup.lng },
        { latitude: order.dropoff.lat, longitude: order.dropoff.lng }
      ];
      if (order.driverId?.currentLocation) {
        points.push({
          latitude: order.driverId.currentLocation.lat,
          longitude: order.driverId.currentLocation.lng
        });
      }

      mapRef.current.fitToCoordinates(points, {
        edgePadding: { top: 100, right: 50, bottom: 400, left: 50 },
        animated: true,
      });
    }
  }, [order?.status]);

  const handleCall = () => {
    if (order?.driverId?.phone) {
      Linking.openURL(`tel:${order.driverId.phone}`);
    }
  };

  const handleChat = () => {
  };

  const renderStatusTimeline = () => {
    const statuses: { label: string; key: OrderStatus[] }[] = [
      { label: "Đã xác nhận", key: ["ACCEPTED", "PICKED_UP", "DELIVERED"] },
      { label: "Đang đến lấy", key: ["ACCEPTED", "PICKED_UP", "DELIVERED"] }, // Simplified logic: if ACCEPTED, it's either confirmed or picking up
      { label: "Đang giao", key: ["PICKED_UP", "DELIVERED"] },
      { label: "Hoàn thành", key: ["DELIVERED"] },
    ];

    const currentStatusIndex = statuses.findIndex(s => s.key.includes(order?.status || "PENDING"));

    return (
      <View className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-gray-100">
        {statuses.map((step, index) => (
          <View key={index} className="flex-1 items-center">
            <View className="flex-row items-center w-full">
              {/* Connector line */}
              <View
                className={`h-1 flex-1 ${index === 0 ? 'bg-transparent' : (index <= currentStatusIndex ? 'bg-green-500' : 'bg-neutral-200')}`}
              />

              {/* Step circle */}
              <View
                className={`w-4 h-4 rounded-full border-2 ${index <= currentStatusIndex ? 'bg-green-500 border-green-500' : 'bg-white border-neutral-300'}`}
              />

              <View
                className={`h-1 flex-1 ${index === statuses.length - 1 ? 'bg-transparent' : (index < currentStatusIndex ? 'bg-green-500' : 'bg-neutral-200')}`}
              />
            </View>
            <Text
              className={`text-sm mt-2 font-JakartaMedium text-center ${index <= currentStatusIndex ? 'text-green-600' : 'text-neutral-400'}`}
            >
              {step.label}
            </Text>
          </View>
        ))}
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
      <View className="flex-1 justify-center items-center bg-white p-6">
        <Text className="text-lg font-JakartaBold text-gray-700">Không tìm thấy đơn hàng</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4 bg-green-500 px-4 py-3 rounded-xl">
          <Text className="text-white font-JakartaBold">Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <SafeAreaView className="absolute top-0 left-0 right-0 z-10 px-4 pt-2">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-md"
          >
            <Ionicons name="chevron-back" size={24} color="black" />
          </TouchableOpacity>
          <View className="bg-white px-4 py-2 rounded-full shadow-md ml-3">
            <Text className="font-JakartaBold">Theo dõi đơn hàng</Text>
          </View>
        </View>
      </SafeAreaView>

      {/* D3: Status Timeline */}
      <View className="absolute top-24 left-0 right-0 z-10">
        {renderStatusTimeline()}
      </View>

      {/* D1: Route Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        className="flex-1"
        initialRegion={{
          latitude: order.pickup.lat,
          longitude: order.pickup.lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {/* Pickup Marker */}
        <Marker
          coordinate={{ latitude: order.pickup.lat, longitude: order.pickup.lng }}
          title="Điểm lấy hàng"
          image={icons.marker}
        />

        {/* Dropoff Marker */}
        <Marker
          coordinate={{ latitude: order.dropoff.lat, longitude: order.dropoff.lng }}
          title="Điểm giao hàng"
          image={icons.pin}
        />

        {/* Driver Marker */}
        {order.driverId?.currentLocation && (
          <Marker
            coordinate={{
              latitude: order.driverId.currentLocation.lat,
              longitude: order.driverId.currentLocation.lng
            }}
            title="Tài xế của bạn"
          >
            <View className="w-10 h-10 bg-green-500 rounded-full border-2 border-white items-center justify-center">
              <Ionicons name="car" size={24} color="white" />
            </View>
          </Marker>
        )}

        {/* Directions: Driver -> Pickup */}
        {order.driverId?.currentLocation && (order.status === "ACCEPTED") && (
          <MapViewDirections
            origin={{ latitude: order.driverId.currentLocation.lat, longitude: order.driverId.currentLocation.lng }}
            destination={{ latitude: order.pickup.lat, longitude: order.pickup.lng }}
            apikey={process.env.EXPO_PUBLIC_GOOGLE_API_KEY || ""}
            strokeWidth={4}
            strokeColor="#3B82F6"
          />
        )}

        {/* Directions: Pickup -> Dropoff */}
        <MapViewDirections
          origin={{ latitude: order.pickup.lat, longitude: order.pickup.lng }}
          destination={{ latitude: order.dropoff.lat, longitude: order.dropoff.lng }}
          apikey={process.env.EXPO_PUBLIC_GOOGLE_API_KEY || ""}
          strokeWidth={4}
          strokeColor="#10B981"
        />
      </MapView>

      {/* D2: Driver Bottom Sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        handleIndicatorStyle={{ backgroundColor: "#D1D5DB" }}
      >
        <BottomSheetView className="flex-1 px-4 pt-2">
          <View className="flex-row items-center justify-between border-b border-gray-100 pb-4">
            <View className="flex-row items-center">
              <Image
                source={{ uri: order.driverId?.avatar || "https://ui-avatars.com/api/?name=" + order.driverId?.name }}
                className="w-16 h-16 rounded-full bg-gray-100"
              />
              <View className="ml-4">
                <Text className="text-lg font-JakartaBold">{order.driverId?.name || "Đang tìm tài xế..."}</Text>
                <Text className="text-neutral-500 font-JakartaMedium">{order.driverId?.licensePlate || "BenGo Driver"}</Text>
                <View className="flex-row items-center mt-1">
                  <Ionicons name="star" size={16} color="#FBBF24" />
                  <Text className="ml-1 text-sm font-JakartaSemiBold">4.9</Text>
                </View>
              </View>
            </View>

            {order.driverId && (
              <View className="flex-row">
                <TouchableOpacity
                  onPress={handleCall}
                  className="w-12 h-12 bg-green-100 rounded-full items-center justify-center mr-3"
                >
                  <Ionicons name="call" size={24} color="#10B981" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleChat}
                  className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center"
                >
                  <Ionicons name="chatbubbles" size={24} color="#3B82F6" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View className="mt-4">
            <Text className="text font-JakartaBold mb-4">Thông tin hành trình</Text>

            <View className="flex-row items-start mb-4">
              <View className="items-center mr-3 mt-1">
                <View className="w-2 h-2 rounded-full bg-blue-500" />
                <View className="w-[1px] h-10 border-l border-neutral-300 border-dashed my-1" />
                <View className="w-2 h-2 rounded-full bg-green-500" />
              </View>
              <View className="flex-1">
                <View className="mb-4">
                  <Text className="text-sm text-neutral-400 font-JakartaMedium">ĐIỂM LẤY HÀNG</Text>
                  <Text className="text-sm font-JakartaSemiBold" numberOfLines={1}>{order.pickup.address}</Text>
                </View>
                <View>
                  <Text className="text-sm text-neutral-400 font-JakartaMedium">ĐIỂM GIAO HÀNG</Text>
                  <Text className="text-sm font-JakartaSemiBold" numberOfLines={1}>{order.dropoff.address}</Text>
                </View>
              </View>
              <View className="items-end">
                <Text className="text-lg font-JakartaExtraBold text-green-600">
                  {(order.totalPrice || 0).toLocaleString("vi-VN")}đ
                </Text>
                <Text className="text-sm text-neutral-400">{order.distanceKm || 0} km</Text>
              </View>
            </View>
          </View>

          {order.status === "DELIVERED" && (
            <TouchableOpacity
              onPress={() => router.replace(`/(root)/payment/${id}` as any)}
              className="mt-4 bg-green-500 py-4 rounded-2xl items-center"
            >
              <Text className="text-white font-JakartaBold text-lg">Hoàn thành & Thanh toán</Text>
            </TouchableOpacity>
          )}
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
};

export default TrackOrderScreen;

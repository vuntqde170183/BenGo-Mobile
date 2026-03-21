import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import { useDriverOrderDetail } from "@/hooks/useDriver";
import VehicleBadge from "@/components/Common/VehicleBadge";

const TripDetailScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: order, isLoading: loading } = useDriverOrderDetail(id || null);
  if (loading) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#22C55E" />
      </View>
    );
  }

  if (!order) {
    return (
      <View className="flex-1 bg-white justify-center items-center p-4">
        <Text className="text-gray-500 font-JakartaMedium text-center">
          Không tìm thấy thông tin chuyến đi
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-4 bg-green-500 px-4 py-2 rounded-full"
        >
          <Text className="text-white font-JakartaBold">Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const formatCurrency = (amount: number = 0) => {
    return (amount || 0).toLocaleString("vi-VN") + " VNĐ";
  };

  const formatDateTime = (dateStr: string) => {
    try {
      if (!dateStr) return "Không rõ";
      const date = new Date(dateStr);
      return `${date.getHours().toString().padStart(2, "0")}:${date
        .getMinutes()
        .toString()
        .padStart(2, "0")} - ${date.getDate().toString().padStart(2, "0")}/${(
          date.getMonth() + 1
        )
          .toString()
          .padStart(2, "0")}/${date.getFullYear()}`;
    } catch (e) {
      return dateStr;
    }
  };

  // Safe coordinate calculation
  const pickupLat = order?.pickup?.lat || 0;
  const pickupLng = order?.pickup?.lng || 0;
  const dropoffLat = order?.dropoff?.lat || 0;
  const dropoffLng = order?.dropoff?.lng || 0;

  return (
    <SafeAreaView className="flex-1 bg-gray-100" edges={["top", "bottom"]}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-4 border-b border-gray-100 bg-white">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="black" />
        </TouchableOpacity>
        <Text className="flex-1 text-center font-JakartaBold text-lg text-gray-700">
          {" "}
          Chi tiết đơn #{order?.id?.slice(-6).toUpperCase() || "KHÔNG RÕ"}
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Map Summary */}
        <View style={{ height: 240, width: "100%", backgroundColor: "#eee" }}>
          {pickupLat !== 0 && (
            <MapView
              style={{ flex: 1 }}
              initialRegion={{
                latitude: (pickupLat + dropoffLat) / 2,
                longitude: (pickupLng + dropoffLng) / 2,
                latitudeDelta: Math.abs(pickupLat - dropoffLat) * 1.5 || 0.05,
                longitudeDelta: Math.abs(pickupLng - dropoffLng) * 1.5 || 0.05,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
            >
              <Marker
                coordinate={{ latitude: pickupLat, longitude: pickupLng }}
                title="Điểm đón"
              >
                <View className="bg-gray-100 p-1 rounded-full shadow-lg border-2 border-green-500">
                  <Ionicons name="radio-button-on" size={20} color="#10B981" />
                </View>
              </Marker>
              <Marker
                coordinate={{ latitude: dropoffLat, longitude: dropoffLng }}
                title="Điểm giao"
              >
                <View className="bg-gray-100 p-1 rounded-full shadow-lg border-2 border-red-500">
                  <Ionicons name="location" size={20} color="#EF4444" />
                </View>
              </Marker>
              <MapViewDirections
                origin={{ latitude: pickupLat, longitude: pickupLng }}
                destination={{ latitude: dropoffLat, longitude: dropoffLng }}
                apikey={process.env.EXPO_PUBLIC_GOOGLE_API_KEY || ""}
                strokeWidth={3}
                strokeColor="#10B981"
              />
            </MapView>
          )}

          <View className="absolute bottom-4 left-4 bg-white/90 px-3 py-1.5 rounded-full border border-gray-100 shadow-sm">
            <Text className="text-gray-700 font-JakartaBold text-sm">
              {order?.distanceKm || 0} km
            </Text>
          </View>
        </View>

        {/* Info Content */}
        <View className="p-4">
          {/* Trip Summary Card */}
          <View className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm mb-4">
            <Text className="text-gray-500 font-JakartaBold text-sm uppercase mb-4">
              Thông tin chuyến đi
            </Text>

            {/* Body: Timeline */}
            <View className="mb-4">
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
                      {order?.pickup?.address ||
                        order?.pickupAddress ||
                        "Không xác định"}
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
                      {order?.dropoff?.address ||
                        order?.dropoffAddress ||
                        "Không xác định"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View className="h-[1px] bg-gray-50 my-2" />

            <View className="flex-row justify-between pt-2">
              <View>
                <Text className="text-gray-500 font-JakartaBold text-sm mb-1">
                  LOẠI XE
                </Text>
                <VehicleBadge vehicleType={order?.vehicleType} />
              </View>
              <View className="items-end">
                <Text className="text-gray-500 font-JakartaBold text-sm mb-1">
                  THỜI GIAN
                </Text>
                <Text className="text-gray-700 font-JakartaBold text-sm">
                  {formatDateTime(order?.createdAt || "")}
                </Text>
              </View>
            </View>
          </View>

          {/* Customer Detail Card */}
          <View className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm mb-4">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-gray-500 font-JakartaBold text-sm uppercase">
                Khách hàng
              </Text>
              {(order?.status === "ACCEPTED" ||
                order?.status === "PICKED_UP") && (
                  <TouchableOpacity className="flex-row items-center bg-green-50 px-3 py-1 rounded-full">
                    <Ionicons name="call" size={12} color="#10B981" />
                    <Text className="text-green-600 font-JakartaBold text-sm ml-1">
                      GỌI NGAY
                    </Text>
                  </TouchableOpacity>
                )}
            </View>

            <View className="flex-row items-center">
              <View className="w-12 h-12 rounded-full overflow-hidden bg-gray-100">
                <Image
                  source={{
                    uri: `https://api.dicebear.com/9.x/bottts/png?seed=${order?.customerId?.name || "Client"
                      }`,
                  }}
                  className="w-full h-full"
                />
              </View>
              <View className="ml-4">
                <Text className="text-gray-700 font-JakartaBold text-base">
                  {order?.customerId?.name || "Khách hàng BenGo"}
                </Text>
                <Text className="text-gray-500 font-JakartaMedium text-sm">
                  {order?.status === "ACCEPTED" || order?.status === "PICKED_UP"
                    ? order?.customerId?.phone || "Chưa có SĐT"
                    : "SĐT đã ẩn"}
                </Text>
              </View>
            </View>
          </View>

          {/* Financial Detail Card */}
          <View className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm mb-4">
            <Text className="text-gray-500 font-JakartaBold text-sm uppercase mb-4">
              Kê khai tài chính
            </Text>

            <View className="space-y-3">
              <View className="flex-row justify-between">
                <Text className="text-gray-500 font-JakartaMedium text-base">
                  Giá cước đơn hàng
                </Text>
                <Text className="text-gray-700 font-JakartaBold text-base">
                  {formatCurrency(order?.totalPrice || 0)}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-500 font-JakartaMedium text-base">
                  Phí dịch vụ (15%)
                </Text>
                <Text className="text-red-500 font-JakartaBold text-base">
                  -{formatCurrency((order?.totalPrice || 0) * 0.15)}
                </Text>
              </View>
              <View className="h-[1px] bg-gray-100 my-2" />
              <View className="flex-row justify-between items-center pt-1">
                <Text className="text-gray-700 font-JakartaBold text-base">
                  Thu nhập thực nhận
                </Text>
                <Text className="text-green-600 font-JakartaBold text-2xl">
                  {formatCurrency((order?.totalPrice || 0) * 0.85)}
                </Text>
              </View>
            </View>
          </View>

          {/* Evidence Photos Card */}
          {order?.goodsImages && order.goodsImages.length > 0 && (
            <View className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm mb-4">
              <Text className="text-gray-500 font-JakartaBold text-sm uppercase mb-4">
                Hình ảnh minh chứng
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {order.goodsImages.map((img: string, idx: number) => (
                  <Image
                    key={idx}
                    source={{ uri: img }}
                    className="w-[100px] h-[100px] rounded-2xl bg-gray-50 border border-gray-100"
                    resizeMode="cover"
                  />
                ))}
              </View>
            </View>
          )}

          <View className="h-10" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default TripDetailScreen;

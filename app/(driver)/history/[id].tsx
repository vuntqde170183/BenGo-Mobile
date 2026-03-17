import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useDriverOrderDetail } from '@/hooks/useDriver';
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
      <View className="flex-1 bg-white justify-center items-center p-6">
        <Text className="text-gray-500 font-JakartaMedium text-center">Không tìm thấy thông tin chuyến đi</Text>
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
    return (amount || 0).toLocaleString('vi-VN') + ' VNĐ';
  };

  const formatDateTime = (dateStr: string) => {
    try {
      if (!dateStr) return 'N/A';
      const date = new Date(dateStr);
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')} - ${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
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
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="bg-white px-4 py-3 flex-row items-center border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text className="flex-1 text-center font-JakartaBold text-lg text-gray-900 mr-8">
          Chi tiết đơn #{order?.id?.slice(-6).toUpperCase() || "N/A"}
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Map Summary */}
        <View style={{ height: 240, width: '100%', backgroundColor: '#eee' }}>
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
                <View className="w-8 h-8 rounded-full border-2 border-green-500 bg-white items-center justify-center">
                  <View className="w-3 h-3 rounded-full bg-green-500" />
                </View>
              </Marker>
              <Marker
                coordinate={{ latitude: dropoffLat, longitude: dropoffLng }}
                title="Điểm giao"
              >
                <View className="w-8 h-8 rounded-full border-2 border-red-500 bg-white items-center justify-center">
                  <View className="w-3 h-3 rounded-full bg-red-500" />
                </View>
              </Marker>
              <Polyline
                coordinates={[
                  { latitude: pickupLat, longitude: pickupLng },
                  { latitude: dropoffLat, longitude: dropoffLng }
                ]}
                strokeColor="#10B981"
                strokeWidth={3}
                lineDashPattern={[5, 5]}
              />
            </MapView>
          )}

          <View className="absolute bottom-4 left-4 bg-white/90 px-3 py-1.5 rounded-full border border-gray-100">
            <Text className="text-gray-900 font-JakartaBold text-sm">{order?.distanceKm || 0} km</Text>
          </View>
        </View>

        {/* Info Content */}
        <View className="p-4">
          {/* Trip Summary */}
          <View className="bg-white p-5 rounded-3xl border border-gray-100 mb-4">
            <Text className="text-gray-500 font-JakartaBold text-sm uppercase mb-4">Thông tin chuyến đi</Text>

            <View className="space-y-4">
              <View className="flex-row items-center border-l-2 border-green-500 pl-4 py-1">
                <View className="flex-1">
                  <Text className="text-gray-500 font-Jakarta text-sm">ĐIỂM ĐÓN</Text>
                  <Text className="text-gray-900 font-JakartaBold text-sm">{order?.pickup?.address || order?.pickupAddress}</Text>
                </View>
              </View>

              <View className="flex-row items-center border-l-2 border-red-500 pl-4 py-1">
                <View className="flex-1">
                  <Text className="text-gray-500 font-Jakarta text-sm">ĐIỂM GIAO</Text>
                  <Text className="text-gray-900 font-JakartaBold text-sm">{order?.dropoff?.address || order?.dropoffAddress}</Text>
                </View>
              </View>

              <View className="h-[1px] bg-gray-50 my-2" />

              <View className="flex-row justify-between">
                <View className="flex-1">
                  <Text className="text-gray-500 font-Jakarta text-sm">LOẠI XE</Text>
                  <Text className="text-gray-900 font-JakartaBold text-sm">{order?.vehicleType}</Text>
                </View>
                <View className="flex-1 items-end">
                  <Text className="text-gray-500 font-Jakarta text-sm">THỜI GIAN</Text>
                  <Text className="text-gray-900 font-JakartaBold text-sm">{formatDateTime(order?.createdAt || "")}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Customer Detail */}
          <View className="bg-white p-5 rounded-3xl border border-gray-100 mb-4">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-gray-500 font-JakartaBold text-sm uppercase">Khách hàng</Text>
              {(order?.status === 'ACCEPTED' || order?.status === 'PICKED_UP') && (
                <TouchableOpacity className="flex-row items-center bg-green-50 px-3 py-1 rounded-full">
                  <Ionicons name="call" size={12} color="#10B981" />
                  <Text className="text-green-600 font-JakartaBold text-sm ml-1">GỌI NGAY</Text>
                </TouchableOpacity>
              )}
            </View>

            <View className="flex-row items-center">
              <View className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center">
                <Ionicons name="person" size={24} color="#CBD5E1" />
              </View>
              <View className="ml-4">
                <Text className="text-gray-900 font-JakartaBold text-base">{order?.customerId?.name || "Khách hàng BenGo"}</Text>
                <Text className="text-gray-500 font-JakartaMedium text-sm">
                  {(order?.status === 'ACCEPTED' || order?.status === 'PICKED_UP') ? (order?.customerId?.phone || "N/A") : '********'}
                </Text>
              </View>
            </View>
          </View>

          {/* Financial Detail */}
          <View className="bg-white p-5 rounded-3xl border border-gray-100 mb-4">
            <Text className="text-gray-500 font-JakartaBold text-sm uppercase mb-4">Kê khai tài chính</Text>

            <View className="space-y-3">
              <View className="flex-row justify-between">
                <Text className="text-gray-500 font-JakartaMedium text-sm">Giá cước gốc</Text>
                <Text className="text-gray-900 font-JakartaBold text-sm">{formatCurrency(order?.totalPrice || 0)}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-500 font-JakartaMedium text-sm">Phí dịch vụ (15%)</Text>
                <Text className="text-red-500 font-JakartaBold text-sm">-{formatCurrency((order?.totalPrice || 0) * 0.15)}</Text>
              </View>
              <View className="h-[1px] bg-gray-100 my-2" />
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-900 font-JakartaBold text-base">Thu nhập thực nhận</Text>
                <Text className="text-green-600 font-JakartaBold text-2xl">{formatCurrency((order?.totalPrice || 0) * 0.85)}</Text>
              </View>
            </View>
          </View>

          {/* Evidence Photos */}
          {order?.goodsImages && order.goodsImages.length > 0 && (
            <View className="bg-white p-5 rounded-3xl border border-gray-100 mb-4">
              <Text className="text-gray-500 font-JakartaBold text-sm uppercase mb-4">Hình ảnh minh chứng</Text>
              <View className="flex-row flex-wrap gap-2">
                {order.goodsImages.map((img: string, idx: number) => (
                  <Image
                    key={idx}
                    source={{ uri: img }}
                    className="w-[100px] h-[100px] rounded-lg bg-gray-100"
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

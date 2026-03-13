import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OrderHistoryItem } from '@/lib/driver';

interface TripCardProps {
  item: OrderHistoryItem;
  onPress: (id: string) => void;
}

const TripCard: React.FC<TripCardProps> = ({ item, onPress }) => {
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return { label: 'Thành công', color: 'text-green-600', bg: 'bg-green-50' };
      case 'CANCELLED':
        return { label: 'Đã hủy', color: 'text-red-600', bg: 'bg-red-50' };
      case 'PENDING':
        return { label: 'Đang chờ', color: 'text-yellow-600', bg: 'bg-yellow-50' };
      case 'ACCEPTED':
        return { label: 'Đã nhận', color: 'text-blue-600', bg: 'bg-blue-50' };
      case 'PICKED_UP':
        return { label: 'Đã lấy hàng', color: 'text-purple-600', bg: 'bg-purple-50' };
      default:
        return { label: status, color: 'text-gray-600', bg: 'bg-gray-50' };
    }
  };

  const statusInfo = getStatusInfo(item.status);

  const formatDateTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')} - ${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    } catch (e) {
      return dateStr;
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('vi-VN') + 'đ';
  };

  return (
    <TouchableOpacity
      onPress={() => onPress(item.id)}
      className="bg-white mx-4 my-2 p-4 rounded-2xl border border-gray-100"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
      }}
    >
      {/* Header */}
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-gray-900 font-JakartaBold text-sm">#{item.id.slice(-6).toUpperCase()}</Text>
        <View className={`${statusInfo.bg} px-3 py-1 rounded-full`}>
          <Text className={`${statusInfo.color} font-JakartaBold text-[10px]`}>{statusInfo.label}</Text>
        </View>
      </View>

      {/* Body */}
      <View className="space-y-3">
        <View className="flex-row items-center">
          <Ionicons name="time-outline" size={14} color="#94A3B8" />
          <Text className="text-gray-500 font-JakartaMedium text-sm ml-2">
            {formatDateTime(item.createdAt)}
          </Text>
        </View>

        <View className="relative pl-6 py-1">
          {/* Vertical Line */}
          <View className="absolute left-[7px] top-[14px] bottom-[14px] w-[1px] bg-gray-200" />

          {/* Pickup */}
          <View className="flex-row items-center mb-3">
            <View className="absolute left-[-23px] w-4 h-4 rounded-full border-2 border-green-500 bg-white items-center justify-center">
              <View className="w-1.5 h-1.5 rounded-full bg-green-500" />
            </View>
            <Text className="text-gray-700 font-JakartaMedium text-sm flex-1" numberOfLines={1}>
              {item.pickupAddress}
            </Text>
          </View>

          {/* Dropoff */}
          <View className="flex-row items-center">
            <View className="absolute left-[-23px] w-4 h-4 rounded-full border-2 border-red-500 bg-white items-center justify-center">
              <View className="w-1.5 h-1.5 rounded-full bg-red-500" />
            </View>
            <Text className="text-gray-700 font-JakartaMedium text-sm flex-1" numberOfLines={1}>
              {item.dropoffAddress}
            </Text>
          </View>
        </View>

        <View className="flex-row justify-between items-end mt-2 pt-2 border-t border-gray-50">
          <View>
            <Text className="text-gray-400 font-Jakarta text-[10px] uppercase">Tổng tiền</Text>
            <Text className="text-green-600 font-JakartaBold text-lg">{formatCurrency(item.totalPrice)}</Text>
          </View>

          <View className="flex-row items-center bg-gray-50 px-3 py-1.5 rounded-xl">
            <Text className="text-gray-400 font-JakartaBold text-sm mr-1">Chi tiết</Text>
            <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default TripCard;

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OrderHistoryItem } from '@/api/driver';

interface TripCardProps {
  item: OrderHistoryItem;
  onPress: (id: string) => void;
}

const TripCard: React.FC<TripCardProps> = ({ item, onPress }) => {
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return { label: 'Thành công', color: 'text-green-600', bg: 'bg-green-100', icon: 'checkmark-circle' as const };
      case 'CANCELLED':
        return { label: 'Đã hủy', color: 'text-red-600', bg: 'bg-red-100', icon: 'close-circle' as const };
      case 'PENDING':
        return { label: 'Đang chờ', color: 'text-yellow-600', bg: 'bg-yellow-100', icon: 'time-outline' as const };
      case 'ACCEPTED':
        return { label: 'Đã nhận', color: 'text-blue-600', bg: 'bg-blue-100', icon: 'car-outline' as const };
      case 'PICKED_UP':
        return { label: 'Đã lấy hàng', color: 'text-purple-600', bg: 'bg-purple-100', icon: 'archive-outline' as const };
      default:
        return { label: status, color: 'text-gray-500', bg: 'bg-gray-100', icon: 'help-circle-outline' as const };
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
      activeOpacity={0.7}
      className="mx-4 my-3 bg-white p-4 rounded-3xl border border-gray-100"
      style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 1 }}
    >
      {/* Header: ID and Status */}
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center">
          <View className="bg-green-50 w-12 h-12 rounded-2xl items-center justify-center mr-3 border border-green-200">
            <Ionicons name="receipt-outline" size={22} color="#10B981" />
          </View>
          <View>
            <Text className="text-gray-500 font-JakartaBold text-sm">Mã đơn hàng</Text>
            <Text className="text-gray-700 font-JakartaBold text-base">#{item.id.slice(-6).toUpperCase()}</Text>
          </View>
        </View>
        <View className={`${statusInfo.bg} px-3 py-1.5 rounded-xl flex-row items-center`}>
          <Ionicons name={statusInfo.icon} size={14} color={statusInfo.color === 'text-green-600' ? '#16a34a' : statusInfo.color === 'text-red-600' ? '#dc2626' : '#4b5563'} />
          <Text className={`${statusInfo.color} font-JakartaBold text-sm ml-1.5`}>{statusInfo.label}</Text>
        </View>
      </View>

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
              <Text className="text-gray-500 font-JakartaBold mb-1 uppercase">
                Điểm đón
              </Text>
              <Text
                className="text-gray-700 font-JakartaMedium"
                numberOfLines={2}
              >
                {item?.pickup?.address || "Không xác định"}
              </Text>
            </View>
            <View>
              <Text className="text-gray-500 font-JakartaBold mb-1 uppercase">
                Điểm giao
              </Text>
              <Text
                className="text-gray-700 font-JakartaMedium"
                numberOfLines={2}
              >
                {item?.dropoff?.address || "Không xác định"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Footer: Time and Price */}
      <View className="flex-row justify-between items-end pt-5 border-t border-gray-100">
        <View>
          <View className="flex-row items-center mb-1">
            <Ionicons name="time-outline" size={20} color="#94A3B8" />
            <Text className="text-gray-500 font-JakartaBold text-sm ml-1.5">Thời gian</Text>
          </View>
          <Text className="text-gray-700 font-JakartaBold text-sm">
            {formatDateTime(item.createdAt)}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-gray-500 font-JakartaBold text-sm mb-1">Bạn nhận được</Text>
          <Text className="text-green-600 font-JakartaBold text-2xl">{formatCurrency(item.totalPrice)}</Text>
        </View>
      </View>

      {/* Detail hint indicator */}
      <View className="mt-4 pt-2 flex-row justify-center items-center opacity-40">
        <Text className="text-primary font-JakartaBold text-base mr-2">Nhấn để xem chi tiết</Text>
        <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
      </View>
    </TouchableOpacity>
  );
};

export default TripCard;

import React from 'react';
import { View, Text } from 'react-native';

interface SummaryCardProps {
  totalEarnings: number;
  totalTrips: number;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ totalEarnings, totalTrips }) => {
  const formatCurrency = (amount?: number): string => {
    if (amount == null || isNaN(amount)) return '0 ₫';
    return amount.toLocaleString('vi-VN') + ' ₫';
  };

  return (
    <View className="mx-5 my-3 bg-white p-4 rounded-2xl shadow-sm border border-gray-50 flex-row items-center justify-between">
      <Text className="text-gray-900 font-Jakarta">
        Thu nhập hôm nay: <Text className="font-JakartaBold">{formatCurrency(totalEarnings)}</Text>
      </Text>
      <View className="w-px h-4 bg-gray-200" />
      <Text className="text-gray-900 font-JakartaBold">{totalTrips} chuyến</Text>
    </View>
  );
};

export default SummaryCard;

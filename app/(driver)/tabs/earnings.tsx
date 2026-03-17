import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const EarningsScreen = () => {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-4 pt-4">
        <Text className="text-2xl font-JakartaBold text-gray-900">Thu nhập</Text>
        <Text className="text-gray-500 mt-1 font-Jakarta">Xem thống kê và số dư của bạn</Text>

        <View
          className="mt-8 bg-green-500 p-6 rounded-3xl"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <Text className="text-white/80 font-Jakarta">Số dư hiện tại</Text>
          <Text className="text-white text-3xl font-JakartaBold mt-1">0 ₫</Text>
        </View>

        <View className="mt-8">
          <Text className="text-lg font-JakartaBold text-gray-900 mb-4">Thống kê gần đây</Text>
          <View className="items-center justify-center py-10 bg-gray-50 rounded-2xl border border-gray-100 border-dashed">
            <Text className="text-gray-500 font-Jakarta">Chưa có dữ liệu thống kê</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default EarningsScreen;

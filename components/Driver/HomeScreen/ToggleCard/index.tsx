import React from 'react';
import { View, Text, Switch } from 'react-native';

interface ToggleCardProps {
  isOnline: boolean;
  onToggle: () => void;
}

const ToggleCard: React.FC<ToggleCardProps> = ({ isOnline, onToggle }) => {
  return (
    <View className="flex-row items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mx-5">
      <View className="flex-row items-center flex-1 pr-4">
        <View className="bg-green-50 w-11 h-11 rounded-2xl items-center justify-center mr-4">
          <Text className="text-xl">🚗</Text>
        </View>
        <View className="flex-1">
          <Text className="text-gray-900 text-[13px] font-JakartaBold">Chế độ nhận đơn</Text>
          <Text className="text-gray-500 text-[11px] font-Jakarta">
            {isOnline ? 'Bạn đang sẵn sàng nhận đơn hàng' : 'Bật để bắt đầu nhận đơn'}
          </Text>
        </View>
      </View>
      <Switch
        trackColor={{ false: "#F3F4F6", true: "#BBF7D0" }}
        thumbColor={isOnline ? "#22C55E" : "#D1D5DB"}
        ios_backgroundColor="#F3F4F6"
        onValueChange={onToggle}
        value={isOnline}
      />
    </View>
  );
};

export default ToggleCard;

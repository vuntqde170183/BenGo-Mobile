import React from 'react';
import { View, Text, Switch, Image } from 'react-native';
import { icons } from '@/constants';

interface HeaderProps {
  isOnline: boolean;
  onToggleStatus: () => void;
  userName?: string;
  avatarUrl?: string;
}

const Header: React.FC<HeaderProps> = ({
  isOnline,
  onToggleStatus,
  userName,
}) => {
  return (
    <View className="flex-row items-center justify-between px-5 py-3 bg-white border-b border-gray-50 rounded-b-2xl shadow-sm">
      <View className="flex-row items-center">
        <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center border border-gray-50">
            <Image 
              source={icons.person}
              className="w-6 h-6"
              tintColor="#374151"
            />
        </View>
        <View className="ml-3">
          <Text className="text-gray-900 text-base font-JakartaBold leading-tight">{userName || 'Tài xế'}</Text>
          <Text className={`text-[10px] font-JakartaMedium ${isOnline ? 'text-green-500' : 'text-gray-400'}`}>
            {isOnline ? '● Đang trực tuyến' : '○ Ngoại tuyến'}
          </Text>
        </View>
      </View>
      
      <View className="flex-row items-center">
        <Switch
          trackColor={{ false: "#E5E7EB", true: "#22C55E" }}
          thumbColor="#FFFFFF"
          ios_backgroundColor="#E5E7EB"
          onValueChange={onToggleStatus}
          value={isOnline}
          style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
        />
      </View>
    </View>
  );
};

export default Header;

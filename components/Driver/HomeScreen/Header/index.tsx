import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface HeaderProps {
  isOnline: boolean;
  onOpenSettings: () => void;
  userName?: string;
}

const Header: React.FC<HeaderProps> = ({
  isOnline,
  onOpenSettings,
  userName,
}) => {
  return (
    <View className="flex-row items-center justify-between px-5 py-4 bg-white border-b border-gray-100">
      <View className="flex-row items-center">
        <View className="bg-green-500 w-10 h-10 rounded-xl items-center justify-center mr-3">
            <Text className="text-white font-JakartaBold text-xl">B</Text>
        </View>
        <View>
          <Text className="text-gray-400 text-xs font-JakartaMedium">Xin chào,</Text>
          <Text className="text-gray-900 text-base font-JakartaBold">{userName || 'Tài xế'}</Text>
        </View>
      </View>
      
      <View className="flex-row items-center">
        <View className="flex-row items-center bg-gray-50 px-3 py-1.5 rounded-full mr-2 border border-gray-100">
          <View className={`w-2 h-2 rounded-full mr-2 ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
          <Text className={`text-[10px] font-JakartaMedium ${isOnline ? 'text-green-600' : 'text-gray-500'}`}>
            {isOnline ? 'Trực tuyến' : 'Ngoại tuyến'}
          </Text>
        </View>
        
        <TouchableOpacity 
          className="w-9 h-9 bg-gray-50 rounded-full items-center justify-center border border-gray-100"
          onPress={onOpenSettings}
        >
          <Ionicons name="settings-outline" size={18} color="#374151" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Header;

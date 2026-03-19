import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LocationCardProps {
  address: string;
  city: string;
  coordinates: string;
  onRefresh?: () => void;
  isLoading?: boolean;
}

const LocationCard: React.FC<LocationCardProps> = ({
  address,
  city,
  coordinates,
  onRefresh,
  isLoading = false,
}) => {
  return (
    <View className="px-4 py-4">
      <View className="flex-row items-center mb-4">
        <Ionicons name="location" size={18} color="#22C55E" />
        <Text className="text-gray-800 text-base font-JakartaBold ml-2">Vị trí hiện tại</Text>
        {isLoading && (
          <ActivityIndicator size="small" color="#22C55E" className="ml-3" />
        )}
      </View>

      <View
        className="bg-white p-4 rounded-2xl border border-gray-100"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 2,
        }}
      >
        <Text className="text-gray-700 text-base font-JakartaSemiBold mb-1" numberOfLines={2}>
          {address}
        </Text>
        {city ? <Text className="text-gray-500 text-base font-JakartaMedium mb-4">{city}</Text> : null}

        <View className="flex-row justify-between items-center pt-3 border-t border-gray-100">
          <Text className="text-gray-500 text-sm font-Jakarta">
            {coordinates || 'Đang xác định...'}
          </Text>
          <TouchableOpacity
            className={`w-8 h-8 rounded-full items-center justify-center bg-gray-50 ${isLoading ? 'opacity-50' : ''}`}
            onPress={onRefresh}
            disabled={isLoading}
          >
            <Ionicons name="refresh" size={16} color="#22C55E" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default LocationCard;

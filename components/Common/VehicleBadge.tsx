import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface VehicleBadgeProps {
  vehicleType: string;
}

const VehicleBadge = ({ vehicleType }: VehicleBadgeProps) => {
  const getVehicleConfig = (type: string) => {
    const normalizedType = type?.toUpperCase();
    switch (normalizedType) {
      case 'BIKE':
        return {
          label: 'Xe máy',
          icon: 'bicycle-outline' as const,
          bgColor: 'bg-green-50',
          textColor: 'text-green-700',
          borderColor: 'border-green-100',
          iconColor: '#10B981',
        };
      case 'VAN':
        return {
          label: 'Xe tải van',
          icon: 'car-sport-outline' as const,
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-700',
          borderColor: 'border-blue-100',
          iconColor: '#3B82F6',
        };
      case 'TRUCK':
        return {
          label: 'Xe tải',
          icon: 'bus-outline' as const,
          bgColor: 'bg-red-50',
          textColor: 'text-red-700',
          borderColor: 'border-red-100',
          iconColor: '#EF4444',
        };
      default:
        return {
          label: type || 'Không xác định',
          icon: 'help-circle-outline' as const,
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-700',
          borderColor: 'border-gray-200',
          iconColor: '#374151',
        };
    }
  };

  const config = getVehicleConfig(vehicleType);

  return (
    <View className={`flex-row w-fit items-center px-3 py-1 rounded-full border ${config.bgColor} ${config.borderColor}`}>
      <Ionicons name={config.icon} size={14} color={config.iconColor} />
      <Text className={`ml-1.5 font-JakartaBold text-sm ${config.textColor}`}>
        {config.label}
      </Text>
    </View>
  );
};

export default VehicleBadge;

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface ActionCardProps {
  icon: string;
  title: string;
  value: string;
  description: string;
  onPress?: () => void;
}

const ActionCard: React.FC<ActionCardProps> = ({
  icon,
  title,
  value,
  description,
  onPress,
}) => {
  return (
    <TouchableOpacity 
      className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex-1 mx-1" 
      onPress={onPress}
    >
      <Text className="text-2xl mb-2">{icon}</Text>
      <Text className="text-gray-500 text-xs font-JakartaMedium mb-1">{title}</Text>
      <Text className="text-gray-900 text-lg font-JakartaBold mb-1">{value}</Text>
      <Text className="text-gray-400 text-[10px] font-Jakarta">{description}</Text>
    </TouchableOpacity>
  );
};

export default ActionCard;

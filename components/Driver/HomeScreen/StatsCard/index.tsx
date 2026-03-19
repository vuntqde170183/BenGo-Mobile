import React from 'react';
import { View, Text } from 'react-native';

interface StatItem {
  value: string;
  label: string;
}

interface StatsCardProps {
  title: string;
  stats: StatItem[];
}

const StatsCard: React.FC<StatsCardProps> = ({ title, stats }) => {
  return (
    <View
      className="bg-white p-5 rounded-2xl border border-gray-100 mt-4 mx-5"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      }}
    >
      <Text className="text-gray-800 text-base font-JakartaBold mb-4">{title}</Text>
      <View className="flex-row justify-around">
        {stats.map((stat, index) => (
          <React.Fragment key={index}>
            <View className="items-center flex-1">
              <Text className="text-gray-700 text-base font-JakartaBold mb-1">{stat.value}</Text>
              <Text className="text-gray-500 text-[9px] font-JakartaMedium text-center">{stat.label}</Text>
            </View>
            {index < stats.length - 1 && (
              <View className="w-[1px] h-8 bg-gray-50 self-center" />
            )}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
};

export default StatsCard;

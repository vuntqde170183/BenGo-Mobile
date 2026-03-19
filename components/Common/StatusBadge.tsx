import React from "react";
import { View, Text } from "react-native";

interface StatusBadgeProps {
  status: string;
}

const statusConfig: Record<string, { label: string; container: string; text: string }> = {
  PENDING: {
    label: "Chờ xác nhận",
    container: "bg-amber-50 border-amber-100",
    text: "text-amber-600",
  },
  ACCEPTED: {
    label: "Đã nhận",
    container: "bg-blue-50 border-blue-100",
    text: "text-blue-600",
  },
  PICKED_UP: {
    label: "Đang giao",
    container: "bg-indigo-50 border-indigo-100",
    text: "text-indigo-600",
  },
  DELIVERED: {
    label: "Hoàn thành",
    container: "bg-green-50 border-green-100",
    text: "text-green-600",
  },
  CANCELLED: {
    label: "Đã hủy",
    container: "bg-red-50 border-red-100",
    text: "text-red-600",
  },
  PRIMARY: {
    label: "Thông báo",
    container: "bg-primary-50 border-primary-100",
    text: "text-primary-600",
  },
  INFO: {
    label: "Thông tin",
    container: "bg-blue-50 border-blue-100",
    text: "text-blue-600",
  },
  SUCCESS: {
    label: "Thành công",
    container: "bg-green-50 border-green-100",
    text: "text-green-600",
  },
  DANGER: {
    label: "Lỗi",
    container: "bg-red-50 border-red-100",
    text: "text-red-600",
  },
  WARNING: {
    label: "Cảnh báo",
    container: "bg-amber-50 border-amber-100",
    text: "text-amber-600",
  },
};

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const config = statusConfig[status.toUpperCase()] || {
    label: status,
    container: "bg-gray-50 border-gray-100",
    text: "text-gray-600",
  };

  return (
    <View className={`px-3 py-1 rounded-full border ${config.container}`}>
      <Text className={`font-JakartaBold text-sm ${config.text}`}>
        {config.label}
      </Text>
    </View>
  );
};

export default StatusBadge;

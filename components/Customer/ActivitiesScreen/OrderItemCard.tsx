import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Order } from "@/api/orders";

const statusColors: Record<string, string> = {
    PENDING: "text-amber-600 bg-amber-50 border-amber-100",
    ACCEPTED: "text-blue-600 bg-blue-50 border-blue-100",
    PICKED_UP: "text-indigo-600 bg-indigo-50 border-indigo-100",
    DELIVERED: "text-green-600 bg-green-50 border-green-100",
    CANCELLED: "text-red-600 bg-red-50 border-red-100",
};

const statusLabels: Record<string, string> = {
    PENDING: "Chờ xác nhận",
    ACCEPTED: "Đã nhận",
    PICKED_UP: "Đang giao",
    DELIVERED: "Hoàn thành",
    CANCELLED: "Đã hủy",
};

const OrderItemCard = ({ order }: { order: Order }) => {
    const handleReorder = () => {
        router.push("/(root)/booking-setup");
    };

    const handlePress = () => {
        // router.push(`/(root)/order-detail/${order._id}` as any);
        console.log("Press order:", order._id);
    };

    return (
        <TouchableOpacity 
            onPress={handlePress}
            className="bg-white m-4 mb-2 p-4 rounded-xl border border-neutral-100 shadow-sm"
            style={{ borderRadius: 12 }}
        >
            <View className="flex-row justify-between items-center mb-4">
                <View className="flex-row items-center">
                    <Ionicons name="barcode-outline" size={20} color="#4B5563" />
                    <Text className="ml-2 text-sm font-JakartaBold text-neutral-800">
                        #{order._id.slice(-8).toUpperCase()}
                    </Text>
                </View>
                <View className={`px-3 py-1 rounded-full border ${statusColors[order.status as string] || ""}`}>
                    <Text className="text-sm font-JakartaSemiBold">
                        {statusLabels[order.status as string] || order.status}
                    </Text>
                </View>
            </View>

            <View className="flex-row mb-4">
                <View className="items-center mr-3 mt-1">
                    <Ionicons name="radio-button-on" size={16} color="#3B82F6" />
                    <View className="w-[1px] h-8 border-l border-neutral-200 my-1" />
                    <Ionicons name="location" size={16} color="#10B981" />
                </View>
                <View className="flex-1">
                    <Text className="text-sm text-neutral-600 font-JakartaMedium mb-4" numberOfLines={1}>
                        {order.pickup.address}
                    </Text>
                    <Text className="text-sm text-neutral-800 font-JakartaSemiBold" numberOfLines={1}>
                        {order.dropoff.address}
                    </Text>
                </View>
            </View>

            <View className="flex-row justify-between items-center pt-4 border-t border-neutral-50">
                <View className="flex-row items-center">
                    <Ionicons name="car-outline" size={20} color="#10B981" />
                    <Text className="ml-2 text-sm font-JakartaBold text-green-600">
                        {order.vehicleType}
                    </Text>
                </View>
                <View className="items-end">
                    <Text className="text-[14px] font-JakartaExtraBold text-neutral-800">
                        {order.totalPrice.toLocaleString("vi-VN")}đ
                    </Text>
                    <Text className="text-sm text-neutral-400 font-JakartaMedium">
                        {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                    </Text>
                </View>
            </View>

            {order.status === "DELIVERED" && (
                <TouchableOpacity 
                    onPress={handleReorder}
                    className="mt-4 bg-green-600 py-3 rounded-xl items-center"
                >
                    <Text className="text-white font-JakartaBold text-sm">Đặt lại</Text>
                </TouchableOpacity>
            )}
        </TouchableOpacity>
    );
};

export default OrderItemCard;

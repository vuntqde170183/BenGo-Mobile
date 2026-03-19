import React from "react";
import { View, Text, TouchableOpacity, Image, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Order } from "@/api/orders";
import VehicleBadge from "@/components/Common/VehicleBadge";
import StatusBadge from "@/components/Common/StatusBadge";



const OrderItemCard = ({ order }: { order: Order }) => {
    const handleReorder = () => {
        router.push("/(root)/booking-setup");
    };

    const handlePress = () => {
        if (order?.id) {
            router.push(`/order-detail/${order.id}` as any);
        } else {
            console.warn("[OrderItemCard] No ID found in order object");
        }
    };

    return (
        <Pressable
            onPress={handlePress}
            className="bg-white p-4 mb-4 rounded-2xl border border-gray-100"
            style={({ pressed }) => ({
                backgroundColor: pressed ? "#F9FAFB" : "white",
                elevation: 3,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
            })}
        >
            <View className="flex-row justify-between items-center mb-4">
                <View className="flex-row items-center">
                    <Ionicons name="barcode-outline" size={20} color="#4B5563" />
                    <Text className="ml-2 text-sm font-JakartaBold text-neutral-800">
                        #{order?.id ? order.id.slice(-8).toUpperCase() : "N/A"}
                    </Text>
                </View>
                <StatusBadge status={order?.status as string} />
            </View>

            <View className="flex-row mb-4">
                <View className="items-center mr-3 mt-1">
                    <Ionicons name="radio-button-on" size={16} color="#3B82F6" />
                    <View className="w-[1px] h-8 border-l border-neutral-200 my-1" />
                    <Ionicons name="location" size={16} color="#10B981" />
                </View>
                <View className="flex-1">
                    <Text className="text-neutral-600 font-JakartaMedium mb-4" numberOfLines={1}>
                        {order?.pickup?.address || "N/A"}
                    </Text>
                    <Text className="text-neutral-800 font-JakartaSemiBold" numberOfLines={1}>
                        {order?.dropoff?.address || "N/A"}
                    </Text>
                </View>
            </View>

            <View className="flex-row justify-between items-center pt-4 border-t border-neutral-50">
                <VehicleBadge vehicleType={order?.vehicleType} />
                <View className="items-end">
                    <Text className="text-[14px] font-JakartaExtraBold text-neutral-800">
                        {order?.totalPrice ? Number(order.totalPrice).toLocaleString("vi-VN") : "0"}đ
                    </Text>
                    <Text className="text-sm text-neutral-400 font-JakartaMedium">
                        {order?.createdAt ? new Date(order.createdAt).toLocaleDateString("vi-VN") : "N/A"}
                    </Text>
                </View>
            </View>

            {order?.status === "DELIVERED" && (
                <TouchableOpacity
                    onPress={handleReorder}
                    className="mt-4 bg-green-600 py-3 rounded-xl items-center"
                >
                    <Text className="text-white font-JakartaBold text-sm">Đặt lại</Text>
                </TouchableOpacity>
            )}
        </Pressable>
    );
};

export default OrderItemCard;

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
            className="bg-white p-4 mb-4 rounded-3xl border border-gray-100"
            style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 1 }}
        >
            <View className="flex-row justify-between items-center mb-4">
                <View className="flex-row items-center">
                    <Ionicons name="barcode-outline" size={20} color="#4B5563" />
                    <Text className="ml-2 text-sm font-JakartaBold text-gray-700">
                        #{order?.id ? order.id.slice(-8).toUpperCase() : "N/A"}
                    </Text>
                </View>
                <StatusBadge status={order?.status as string} />
            </View>

            {/* Body: Timeline */}
            <View className="mb-4">
                <View className="flex-row items-start">
                    <View className="items-center mr-4 pt-1.5">
                        <View className="w-5 h-5 rounded-full border-2 border-green-500 bg-white items-center justify-center">
                            <View className="w-2 h-2 rounded-full bg-green-500" />
                        </View>
                        <View className="w-[1px] h-16 bg-gray-200 my-1 border-dashed" />
                        <View className="w-5 h-5 rounded-full border-2 border-red-500 bg-white items-center justify-center">
                            <View className="w-2 h-2 rounded-full bg-red-500" />
                        </View>
                    </View>

                    <View className="flex-1">
                        <View className="mb-4">
                            <Text className="text-gray-500 font-JakartaBold mb-1">
                                Điểm đón
                            </Text>
                            <Text
                                className="text-gray-700 font-JakartaBold"
                                numberOfLines={2}
                            >
                                {order?.pickup?.address || "Không xác định"}
                            </Text>
                        </View>
                        <View>
                            <Text className="text-gray-500 font-JakartaBold mb-1">
                                Điểm giao
                            </Text>
                            <Text
                                className="text-gray-700 font-JakartaBold"
                                numberOfLines={2}
                            >
                                {order?.dropoff?.address || "Không xác định"}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            <View className="flex-row justify-between items-center pt-4 border-t border-neutral-50">
                <VehicleBadge vehicleType={order?.vehicleType} />
                <View className="items-end">
                    <Text className="text-[14px] font-JakartaExtraBold text-gray-700">
                        {order?.totalPrice ? Number(order.totalPrice).toLocaleString("vi-VN") : "0"}đ
                    </Text>
                    <Text className="text-sm text-neutral-400 font-JakartaMedium">
                        {order?.createdAt ?
                            `${new Date(order.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false })} - ${new Date(order.createdAt).toLocaleDateString("vi-VN")}`
                            : "N/A"}
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

import React from "react";
import { View, Text, TouchableOpacity, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Order } from "@/api/orders";
import VehicleBadge from "@/components/Common/VehicleBadge";
import StatusBadge from "@/components/Common/StatusBadge";
import CustomButton from "@/components/Common/CustomButton";

const OrderItemCard = ({ order }: { order: Order }) => {
    const handleReorder = () => {
        router.push("/(root)/booking-setup");
    };

    const handlePress = () => {
        if (order?.id) {
            router.push(`/order-detail/${order.id}` as any);
        }
    };

    const formatDateTime = (dateStr: string) => {
        try {
            if (!dateStr) return "Không rõ";
            const date = new Date(dateStr);
            return `${date.getHours().toString().padStart(2, "0")}:${date
                .getMinutes()
                .toString()
                .padStart(2, "0")} - ${date.getDate().toString().padStart(2, "0")}/${(
                    date.getMonth() + 1
                )
                    .toString()
                    .padStart(2, "0")}/${date.getFullYear()}`;
        } catch (e) {
            return dateStr;
        }
    };

    return (
        <Pressable
            onPress={handlePress}
            className="my-2 bg-white p-4 rounded-3xl border border-gray-100"
            style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 1 }}
        >
            {/* Header: ID and Status */}
            <View className="flex-row justify-between items-center mb-4">
                <View className="flex-row items-center">
                    <View className="bg-green-50 w-12 h-12 rounded-2xl items-center justify-center mr-3 border border-green-200">
                        <Ionicons name="receipt-outline" size={22} color="#10B981" />
                    </View>
                    <View>
                        <Text className="text-gray-500 font-JakartaBold text-sm">Mã đơn hàng</Text>
                        <Text className="text-gray-700 font-JakartaBold text-base uppercase">#{order?.id ? order.id.slice(-8).toUpperCase() : "N/A"}</Text>
                    </View>
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
                            <Text className="text-gray-500 font-JakartaBold mb-1 uppercase">Điểm đón</Text>
                            <Text className="text-gray-700 font-JakartaBold" numberOfLines={2}>
                                {order?.pickup?.address || "Không xác định"}
                            </Text>
                        </View>
                        <View>
                            <Text className="text-gray-500 font-JakartaBold mb-1 uppercase">Điểm giao</Text>
                            <Text className="text-gray-700 font-JakartaBold" numberOfLines={2}>
                                {order?.dropoff?.address || "Không xác định"}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Footer: Time and Price */}
            <View className="flex-row justify-between items-end pt-5 border-t border-gray-100">
                <View>
                    <View className="flex-row items-center mb-2">
                        <VehicleBadge vehicleType={order?.vehicleType} />
                    </View>
                    <View className="flex-row items-center">
                        <Ionicons name="time-outline" size={16} color="#94A3B8" />
                        <Text className="text-gray-500 font-JakartaBold text-sm ml-1">
                            {formatDateTime(order?.createdAt || "")}
                        </Text>
                    </View>
                </View>
                <View className="items-end">
                    <Text className="text-gray-500 font-JakartaBold text-sm mb-1">Tổng phí</Text>
                    <Text className="text-green-600 font-JakartaExtraBold text-2xl">
                        {order?.totalPrice ? Number(order.totalPrice).toLocaleString("vi-VN") : "0"}đ
                    </Text>
                </View>
            </View>

            {/* Reorder Button for Delivered orders */}
            {order?.status === "DELIVERED" && (
                <CustomButton
                    title="Đặt lại chuyến này"
                    onPress={handleReorder}
                    bgVariant="outline"
                    textVariant="primary"
                    className="mt-4"
                />
            )}

            {/* Detail hint indicator */}
            <View className="mt-4 pt-2 flex-row justify-center items-center opacity-40">
                <Text className="text-primary font-JakartaBold text-base mr-2">Nhấn để xem chi tiết</Text>
                <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
            </View>
        </Pressable>
    );
};

export default OrderItemCard;

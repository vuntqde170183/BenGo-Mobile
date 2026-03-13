import React, { useState } from "react";
import { View, Text, FlatList, RefreshControl, ActivityIndicator, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useOrderHistory } from "@/hooks/useOrders";
import OrderItemCard from "@/components/Customer/ActivitiesScreen/OrderItemCard";

const EmptyState = () => (
    <View className="flex-1 justify-center items-center p-10 bg-white">
        <View className="w-24 h-24 bg-neutral-50 rounded-full items-center justify-center mb-6">
            <Ionicons name="document-text-outline" size={48} color="#9CA3AF" />
        </View>
        <Text className="text-lg font-JakartaBold text-neutral-800 text-center">
            Bạn chưa có đơn hàng nào
        </Text>
        <Text className="font-JakartaMedium text-neutral-400 text-center mt-2">
            Khi bạn đặt đơn, hành trình của bạn sẽ xuất hiện tại đây.
        </Text>
    </View>
);

const ActivitiesScreen = () => {
    const [selectedTab, setSelectedTab] = useState<"ONGOING" | "HISTORY">("ONGOING");

    const { data, isLoading, refetch } = useOrderHistory({
        status: "ALL",
        page: 1,
        limit: 20
    });

    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    };

    const orderData = Array.isArray(data) ? data : [];
    
    // Log để debug trạng thái PENDING theo yêu cầu
    console.log(`[Activities] Tab: ${selectedTab} | Total Orders fetched:`, orderData.length);
    if (orderData.length > 0) {
        const pendingOrders = orderData.filter(o => o?.status === "PENDING");
        console.log(`[Activities] PENDING orders found:`, pendingOrders.length);
        if (pendingOrders.length > 0) {
            console.log(`[Activities] Found PENDING order with ID: ${pendingOrders[0].id}`);
        }
    }

    const filteredData = selectedTab === "ONGOING"
        ? orderData.filter(o => ["PENDING", "ACCEPTED", "PICKED_UP"].includes(o?.status))
        : orderData.filter(o => ["DELIVERED", "CANCELLED"].includes(o?.status));

    return (
        <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
            <View className="px-6 py-4 border-b border-neutral-50 mb-2">
                <Text className="text-2xl font-JakartaExtraBold text-neutral-800">Hoạt động</Text>
            </View>

            <View className="flex-row px-6 mb-4">
                <TouchableOpacity
                    onPress={() => setSelectedTab("ONGOING")}
                    className={`flex-1 py-3 items-center border-b-2 ${selectedTab === "ONGOING" ? "border-green-600" : "border-transparent"}`}
                >
                    <Text className={`font-JakartaBold ${selectedTab === "ONGOING" ? "text-green-600" : "text-neutral-400"}`}>
                        Đang diễn ra
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setSelectedTab("HISTORY")}
                    className={`flex-1 py-3 items-center border-b-2 ${selectedTab === "HISTORY" ? "border-green-600" : "border-transparent"}`}
                >
                    <Text className={`font-JakartaBold ${selectedTab === "HISTORY" ? "text-green-600" : "text-neutral-400"}`}>
                        Lịch sử
                    </Text>
                </TouchableOpacity>
            </View>

            {isLoading && !refreshing ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#16a34a" />
                    <Text className="mt-4 text-sm font-JakartaMedium text-neutral-500">Đang tải...</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredData}
                    keyExtractor={(item) => item?.id || Math.random().toString()}
                    renderItem={({ item }) => <OrderItemCard order={item} />}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#16a34a"]} />
                    }
                    contentContainerStyle={{ flexGrow: 1, backgroundColor: "#F9FAFB", paddingBottom: 20 }}
                    ListEmptyComponent={EmptyState}
                />
            )}
        </SafeAreaView>
    );
};

export default ActivitiesScreen;

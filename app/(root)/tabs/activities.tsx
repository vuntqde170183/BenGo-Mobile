import React, { useState } from "react";
import { View, Text, FlatList, RefreshControl, ActivityIndicator, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useOrderHistory } from "@/hooks/useOrders";
import OrderItemCard from "@/components/Customer/ActivitiesScreen/OrderItemCard";

const EmptyState = () => (
    <View className="flex-1 justify-center items-center p-10 bg-white">
        <View className="w-24 h-24 bg-neutral-50 rounded-full items-center justify-center mb-4">
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


    return (
        <SafeAreaView className="flex-1 bg-gray-100" edges={["top"]}>
            {/* Header */}
            <View className="flex-row items-center px-4 py-4 border-b border-gray-100 bg-white">
                <Text className="flex-1 text-center font-JakartaBold text-lg text-gray-700">Tất cả đơn hàng</Text>
            </View>

            {isLoading && !refreshing ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#16a34a" />
                    <Text className="mt-4 text-sm font-JakartaMedium text-neutral-500">Đang tải...</Text>
                </View>
            ) : (
                <FlatList
                    data={orderData}
                    className="flex-1"
                    showsVerticalScrollIndicator={false}
                    keyExtractor={(item) => item?.id || Math.random().toString()}
                    renderItem={({ item }) => <OrderItemCard order={item} />}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#16a34a"]} />
                    }
                    contentContainerStyle={{
                        flexGrow: 1,
                        paddingBottom: 100,
                        paddingHorizontal: 16,
                        paddingTop: 16
                    }}
                    ListEmptyComponent={EmptyState}
                />
            )}
        </SafeAreaView>
    );
};

export default ActivitiesScreen;

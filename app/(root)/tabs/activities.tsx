import React, { useState } from "react";
import { View, Text, FlatList, RefreshControl, ActivityIndicator, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { Ionicons } from "@expo/vector-icons";

import { useOrderHistory } from "@/hooks/useOrders";
import { Order } from "@/api/orders";
import OrderItemCard from "@/components/Customer/ActivitiesScreen/OrderItemCard";

const Tab = createMaterialTopTabNavigator();

const EmptyState = () => (
    <View className="flex-1 justify-center items-center p-10 bg-white">
        <View className="w-24 h-24 bg-neutral-50 rounded-full items-center justify-center mb-6">
            <Ionicons name="document-text-outline" size={48} color="#9CA3AF" />
        </View>
        <Text className="text-lg font-JakartaBold text-neutral-800 text-center">
            Bạn chưa có đơn hàng nào
        </Text>
        <Text className="text-sm font-JakartaMedium text-neutral-400 text-center mt-2">
            Khi bạn đặt đơn, hành trình của bạn sẽ xuất hiện tại đây.
        </Text>
    </View>
);

const OrderList = ({ statusFilter }: { statusFilter: string }) => {
    const { data, isLoading, refetch } = useOrderHistory({ 
        status: statusFilter,
        page: 1,
        limit: 20
    });

    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    };

    if (isLoading && !refreshing) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" color="#16a34a" />
                <Text className="mt-4 text-sm font-JakartaMedium text-neutral-500">Đang tải danh sách...</Text>
            </View>
        );
    }

    const filteredData = statusFilter === "ONGOING" 
        ? data?.filter(o => ["PENDING", "ACCEPTED", "PICKED_UP"].includes(o.status))
        : data?.filter(o => ["DELIVERED", "CANCELLED"].includes(o.status));

    return (
        <FlatList
            data={filteredData}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => <OrderItemCard order={item} />}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#16a34a"]} />
            }
            contentContainerStyle={{ flexGrow: 1, backgroundColor: "#F9FAFB", paddingBottom: 20 }}
            ListEmptyComponent={<EmptyState />}
        />
    );
};

const OngoingOrders = () => <OrderList statusFilter="ONGOING" />;
const HistoryOrders = () => <OrderList statusFilter="HISTORY" />;

const ActivitiesScreen = () => {
    return (
        <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
            <View className="px-6 py-4 border-b border-neutral-50">
                <Text className="text-2xl font-JakartaExtraBold text-neutral-800">Hoạt động</Text>
            </View>
            
            <Tab.Navigator
                screenOptions={{
                    tabBarActiveTintColor: "#0047AB",
                    tabBarInactiveTintColor: "#9CA3AF",
                    tabBarLabelStyle: { 
                        fontSize: 14, 
                        fontFamily: "Jakarta-Bold", 
                        textTransform: "none" 
                    },
                    tabBarIndicatorStyle: { 
                        backgroundColor: "#0047AB", 
                        height: 3,
                        borderRadius: 3
                    },
                    tabBarStyle: {
                        elevation: 0,
                        shadowOpacity: 0,
                        borderBottomWidth: 1,
                        borderBottomColor: "#F3F4F6"
                    }
                }}
            >
                <Tab.Screen 
                    name="Ongoing" 
                    component={OngoingOrders} 
                    options={{ title: "Đang diễn ra" }} 
                />
                <Tab.Screen 
                    name="History" 
                    component={HistoryOrders} 
                    options={{ title: "Lịch sử" }} 
                />
            </Tab.Navigator>
        </SafeAreaView>
    );
};

export default ActivitiesScreen;

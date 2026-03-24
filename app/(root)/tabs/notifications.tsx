import React from "react";
import {
  View,
  Text,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";

import { useNotifications, useMarkNotificationRead } from "@/hooks/useNotifications";
import { Notification } from "@/api/notifications";

const NotificationItem = ({ item, onRead }: { item: Notification; onRead: (id: string) => void }) => {
  const router = useRouter();

  const handlePress = () => {
    if (!item.isRead) {
      onRead(item._id);
    }
    // Customer side deep linking
    if (item.data?.orderId) {
      router.push(`/(root)/order-detail/${item.data.orderId}`);
    }
  };

  const formattedTime = item.createdAt ?
    `${new Date(item.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false })} - ${new Date(item.createdAt).toLocaleDateString("vi-VN")}`
    : "N/A";

  const getIcon = (type: string) => {
    switch (type) {
      case "ORDER_STATUS":
        return "receipt-outline";
      case "WALLET":
        return "wallet-outline";
      case "SYSTEM":
        return "information-circle-outline";
      default:
        return "notifications-outline";
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handlePress}
      className={`mx-4 mb-3 p-4 bg-white rounded-3xl border border-gray-100 shadow-sm flex-row items-center ${!item.isRead ? 'border-l-4 border-l-green-600' : ''}`}
      style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 1 }}
    >
      <View className={`bg-green-50 w-12 h-12 rounded-2xl items-center justify-center mr-4 border border-green-200`}>
        <Ionicons name={getIcon(item.type)} size={22} color="#10B981" />
      </View>
      <View className="flex-1">
        <View className="flex-row justify-between items-center mb-1">
          <Text className={`font-JakartaBold text-sm uppercase text-gray-400 mb-1`} numberOfLines={1}>
            {item.title}
          </Text>
          {!item.isRead && <View className="w-2 h-2 rounded-full bg-green-600" />}
        </View>
        <Text className="text-gray-700 font-JakartaBold text-base mb-1" numberOfLines={2}>
          {item.message}
        </Text>
        <Text className="text-sm text-neutral-400 font-JakartaMedium">
          {formattedTime}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const NotificationsScreen = () => {
  const { data: notifications, isLoading, refetch } = useNotifications();
  const { mutate: markRead } = useMarkNotificationRead();

  const handleMarkRead = (id: string) => {
    markRead(id);
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100" edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Header & Search */}
      <View className="px-4 py-2 mb-4">
        <Text className="text-xl font-JakartaBold text-gray-700 mb-4">Thông báo</Text>
      </View>

      <FlatList
        data={notifications as Notification[] || []}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <NotificationItem item={item} onRead={handleMarkRead} />
        )}
        contentContainerClassName="pt-2 pb-20"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View className="flex-1 items-center justify-center py-20 px-10">
            <View className="bg-gray-100 w-20 h-20 rounded-full items-center justify-center mb-4">
              <Ionicons name="notifications-off-outline" size={40} color="#94A3B8" />
            </View>
            <Text className="text-gray-900 font-JakartaBold text-lg text-center mb-2">Chưa có thông báo nào</Text>
            <Text className="text-gray-500 font-JakartaMedium text-sm text-center">
              Chúng tôi sẽ thông báo cho bạn khi có tin mới về đơn hàng hoặc tài khoản.
            </Text>
          </View>
        )}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} colors={["#16a34a"]} />
        }
      />
    </SafeAreaView>
  );
};

export default NotificationsScreen;

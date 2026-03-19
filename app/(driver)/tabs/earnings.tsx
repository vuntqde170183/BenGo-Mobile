import React, { useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BarChart } from "react-native-chart-kit";
import { format, isValid, subDays } from "date-fns";
import { vi } from "date-fns/locale";

import { useDriverStats, useDriverOrders } from "@/hooks/useDriver";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const MOCK_CHART_DATA = {
  labels: ["T2", "T3", "T4", "T5", "T6", "T7", "CN"],
  datasets: [
    {
      data: [450, 320, 580, 410, 690, 850, 720],
    },
  ],
};

const EarningsScreen = () => {
  // Fix to 7 days by default since TIME_FILTERS is removed
  const dateRange = useMemo(() => {
    const today = new Date();
    const fromDate = subDays(today, 7);
    return {
      from: format(fromDate, "yyyy-MM-dd"),
      to: format(today, "yyyy-MM-dd"),
    };
  }, []);

  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useDriverStats(dateRange.from, dateRange.to);

  const {
    data: ordersData,
    isLoading: ordersLoading,
    error: ordersError,
    refetch: refetchOrders,
  } = useDriverOrders({
    limit: 10,
    status: "DELIVERED",
    time: "week",
  });

  const onRefresh = useCallback(() => {
    refetchStats();
    refetchOrders();
  }, [refetchStats, refetchOrders]);

  const formatCurrency = (amount: any = 0) => {
    try {
      const num = Number(amount) || 0;
      return num.toLocaleString("vi-VN") + " ₫";
    } catch (e) {
      return (amount || 0) + " ₫";
    }
  };

  const renderTransactionItem = (item: any) => {
    if (!item) return null;

    const orderId = String(item.id || "").slice(-6).toUpperCase() || "N/A";
    const date = item.createdAt ? new Date(item.createdAt) : null;
    const dateString = date && isValid(date)
      ? format(date, "HH:mm - dd/MM/yyyy", { locale: vi })
      : "Không rõ thời gian";
    const price = Number(item.totalPrice) || 0;

    return (
      <View key={String(item.id)} className="flex-row items-center py-4 border-b border-gray-100">
        <View className="bg-green-50 w-12 h-12 rounded-2xl items-center justify-center mr-3">
          <Ionicons name="add-circle" size={24} color="#10B981" />
        </View>
        <View className="flex-1">
          <Text className="text-gray-700 font-JakartaBold text-base">
            Thu nhập đơn #{orderId}
          </Text>
          <Text className="text-gray-500 font-Jakarta text-sm">
            {dateString}
          </Text>
        </View>
        <Text className="text-green-600 font-JakartaBold text-base">
          +{formatCurrency(price * 0.85)}
        </Text>
      </View>
    );
  };

  const transactions = ordersData?.data?.data || [];
  const isRefreshing = statsLoading || ordersLoading;

  return (
    <SafeAreaView className="flex-1 bg-gray-100" edges={["top"]}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={["#10B981"]}
          />
        }
      >
        <View className="px-4 py-4">
          <Text className="text-2xl font-JakartaBold text-gray-700 mb-4">
            Thu nhập
          </Text>

          {/* Wallet Balance Header */}
          <LinearGradient
            colors={["#059669", "#10B981"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="rounded-3xl p-5 mb-4 shadow-sm overflow-hidden"
          >
            <View className="flex-row justify-between items-start">
              <View>
                <Text className="text-white/80 font-JakartaMedium text-sm mb-1">
                  Số dư ví BenGo
                </Text>
                <Text className="text-white font-JakartaBold text-3xl">
                  {formatCurrency(stats?.totalEarnings)}
                </Text>
              </View>
              <View className="bg-white/20 p-3 rounded-2xl">
                <Ionicons name="wallet-outline" size={28} color="white" />
              </View>
            </View>

            <View className="mt-4 flex-row items-center">
              <View className="flex-1">
                <Text className="text-white/80 font-JakartaMedium text-sm uppercase">
                  Tổng chuyến đi
                </Text>
                <Text className="text-white font-JakartaBold text-lg">
                  {stats?.totalTrips || 0}
                </Text>
              </View>
              <View className="w-[1px] h-8 bg-white/20 mx-4" />
              <View className="flex-1">
                <Text className="text-white/80 font-JakartaMedium text-sm uppercase">
                  Đánh giá trung bình
                </Text>
                <View className="flex-row items-center">
                  <Text className="text-white font-JakartaBold text-lg mr-1">
                    {stats?.rating || 5.0}
                  </Text>
                  <Ionicons name="star" size={14} color="#FBBF24" />
                </View>
              </View>
            </View>
          </LinearGradient>

          {/* Chart Section */}
          <View className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm mb-4">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-gray-700 font-JakartaBold text-lg">
                Thống kê doanh thu
              </Text>
              <Text className="text-gray-500 font-Jakarta text-sm">
                (nghìn VND)
              </Text>
            </View>

            <View style={{ height: 220, position: 'relative' }}>
              <View
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 10,
                  bottom: 30,
                  width: 2,
                  backgroundColor: '#059669',
                  zIndex: 10,
                }}
              />
              <View
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 30,
                  height: 2,
                  backgroundColor: '#059669',
                  zIndex: 10,
                }}
              />
              <BarChart
                data={MOCK_CHART_DATA}
                width={SCREEN_WIDTH - 64}
                height={220}
                yAxisLabel=""
                yAxisSuffix=""
                fromZero
                segments={4}
                chartConfig={{
                  backgroundColor: "#ffffff",
                  backgroundGradientFrom: "#ffffff",
                  backgroundGradientTo: "#ffffff",
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                  barPercentage: 0.6,
                  propsForBackgroundLines: {
                    stroke: "#E5E7EB",
                    strokeDasharray: "4",
                  },
                }}
                style={{
                  borderRadius: 16,
                }}
              />
            </View>
          </View>

          {/* Transaction List */}
          <View className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-gray-700 font-JakartaBold text-lg">
                Lịch sử giao dịch
              </Text>
              <TouchableOpacity>
                <Text className="text-green-600 font-JakartaBold text-base">
                  Xem tất cả
                </Text>
              </TouchableOpacity>
            </View>

            {(statsLoading || ordersLoading) && transactions.length === 0 ? (
              <View className="py-10">
                <ActivityIndicator color="#10B981" />
              </View>
            ) : transactions.length > 0 ? (
              transactions.map((item: any) => renderTransactionItem(item))
            ) : (
              <View className="items-center justify-center py-20">
                <Ionicons name="receipt-outline" size={48} color="#CBD5E1" />
                <Text className="text-gray-500 font-JakartaMedium text-sm mt-4">
                  Không có giao dịch nào
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default EarningsScreen;

import React, { useMemo, useCallback, useEffect, useState } from "react";
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
import { BarChart } from "react-native-chart-kit";
import { format, isValid, subDays } from "date-fns";
import { vi } from "date-fns/locale";

import { useDriverStats, useDriverOrders } from "@/hooks/useDriver";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const EarningsScreen = () => {
  const [showTodayOnly, setShowTodayOnly] = useState(false);
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
    refetch: refetchStats,
  } = useDriverStats(dateRange.from, dateRange.to);

  const {
    data: ordersData,
    isLoading: ordersLoading,
    refetch: refetchOrders,
  } = useDriverOrders({
    limit: 20,
    status: "DELIVERED",
    time: "week",
  });

  const calculatedStats = useMemo(() => {
    const transactions = ordersData?.data || [];
    let grossEarnings = 0;

    transactions.forEach((order: any) => {
      grossEarnings += Number(order.totalPrice) || 0;
    });

    const netEarnings = grossEarnings * 0.85;

    return {
      totalGross: grossEarnings,
      totalNet: netEarnings,
      totalTrips: ordersData?.pagination?.total || transactions.length,
      rating: stats?.rating || 5.0
    };
  }, [ordersData, stats]);

  const chartData = useMemo(() => {
    const labels = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
    const dailyNetEarnings = [0, 0, 0, 0, 0, 0, 0];

    const transactions = ordersData?.data || [];

    transactions.forEach((order: any) => {
      if (order.createdAt) {
        const date = new Date(order.createdAt);
        let dayIndex = date.getDay();
        dayIndex = dayIndex === 0 ? 6 : dayIndex - 1;

        if (dayIndex >= 0 && dayIndex < 7) {
          dailyNetEarnings[dayIndex] += (Number(order.totalPrice) * 0.85) / 1000;
        }
      }
    });

    return {
      labels,
      datasets: [{ data: dailyNetEarnings }],
    };
  }, [ordersData]);

  const todayData = useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    const transactions = ordersData?.data || [];
    const filtered = transactions.filter((order: any) => {
      if (!order.createdAt) return false;
      return format(new Date(order.createdAt), "yyyy-MM-dd") === today;
    });

    let totalIncome = 0;
    filtered.forEach((order: any) => {
      totalIncome += (Number(order.totalPrice) || 0) * 0.85;
    });

    return {
      transactions: filtered,
      totalIncome,
      count: filtered.length
    };
  }, [ordersData]);

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

    const orderId = String(item.id || "").slice(-6).toUpperCase();
    const date = item.createdAt ? new Date(item.createdAt) : null;
    const dateString = date && isValid(date)
      ? format(date, "HH:mm, dd/MM", { locale: vi })
      : "---";
    const netPrice = (Number(item.totalPrice) || 0) * 0.85;

    return (
      <View key={String(item.id)} className="bg-white p-4 rounded-2xl mb-3 border border-gray-100 shadow-sm flex-row items-center">
        <View className="bg-green-100/50 w-12 h-12 rounded-xl items-center justify-center mr-4">
          <Ionicons name="car-outline" size={24} color="#059669" />
        </View>
        <View className="flex-1 mr-2">
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-gray-900 font-JakartaBold text-base">
              Đơn #{orderId}
            </Text>
            <Text className="text-green-600 font-JakartaBold text-base">
              +{formatCurrency(netPrice)}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="time-outline" size={12} color="#94A3B8" className="mr-1" />
            <Text className="text-gray-500 font-JakartaMedium text-sm mr-3">
              {dateString}
            </Text>
            <Ionicons name="location-outline" size={12} color="#94A3B8" className="mr-1" />
            <Text className="text-gray-500 font-JakartaMedium text-sm flex-1" numberOfLines={1}>
              {item.pickupAddress}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const transactions = ordersData?.data || [];
  const isRefreshing = statsLoading || ordersLoading;

  return (
    <SafeAreaView className="flex-1 bg-gray-100" edges={["top"]}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={["#059669"]} tintColor="#059669" />
        }
      >
        <View className="p-4">
          <View className="flex-row justify-between items-center mb-5">
            <Text className="text-2xl font-JakartaBold text-slate-800">
              Thu nhập
            </Text>
          </View>

          {/* Main Balance Card */}
          <View className="mb-4">
            <View
              style={{
                padding: 16,
                borderRadius: 28,
                elevation: 8,
                shadowColor: "#059669",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                backgroundColor: "#059669"
              }}
            >
              <View className="flex-row justify-between items-start">
                <View>
                  <Text className="text-white/70 font-JakartaMedium text-base mb-1">
                    Tổng thu nhập thực nhận (Tuần này)
                  </Text>
                  <Text className="text-white font-JakartaExtraBold text-3xl">
                    {formatCurrency(calculatedStats?.totalNet)}
                  </Text>
                </View>
                <View className="bg-white/20 p-2.5 rounded-2xl">
                  <Ionicons name="wallet" size={24} color="white" />
                </View>
              </View>

              {/* Fee Notification Bubble */}
              <View className="mt-4 bg-black/10 self-start px-3 py-1.5 rounded-full flex-row items-center border border-white/10">
                <Ionicons name="information-circle" size={16} color="white" />
                <Text className="text-white/90 font-JakartaMedium text-sm ml-1">
                  Đã khấu trừ 15% phí nền tảng
                </Text>
              </View>

              <View className="mt-4 flex-row items-center bg-white/10 p-4 rounded-2xl border border-white/10">
                <View className="flex-1 items-center">
                  <Text className="text-white font-JakartaSemiBold text-sm uppercase mb-1">
                    Tổng chuyến
                  </Text>
                  <Text className="text-white font-JakartaBold text-lg">
                    {calculatedStats?.totalTrips}
                  </Text>
                </View>
                <View className="w-[1px] h-8 bg-white/20" />
                <View className="flex-1 items-center">
                  <Text className="text-white font-JakartaSemiBold text-sm uppercase mb-1">
                    Xếp hạng
                  </Text>
                  <View className="flex-row items-center">
                    <Text className="text-white font-JakartaBold text-lg mr-1">
                      {calculatedStats?.rating.toFixed(1)}
                    </Text>
                    <Ionicons name="star" size={14} color="#FBBF24" />
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Chart Header */}
          <View className="flex-row justify-between items-center mb-4 px-1">
            <View>
              <View className="flex-row items-center mb-1">
                <View className="bg-green-600 w-7 h-7 rounded-full items-center justify-center mr-2 border border-green-200">
                  <Ionicons name="bar-chart" size={14} color="#ffffff" />
                </View>
                <Text className="text-lg font-JakartaBold text-green-600">Phân tích tuần</Text>
              </View>
            </View>
            <Text className="text-green-600 font-JakartaBold">
              {format(new Date(dateRange.from), "dd/MM")} - {format(new Date(dateRange.to), "dd/MM")}
            </Text>
          </View>

          {/* Chart Card */}
          <View className="bg-white p-4 pt-8 rounded-[32px] border border-gray-100 shadow-sm mb-4">
            <View style={{ marginLeft: -16 }}>
              <BarChart
                data={chartData}
                width={SCREEN_WIDTH - 64}
                height={200}
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
                  labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
                  barPercentage: 0.5,
                  propsForBackgroundLines: {
                    stroke: "#F1F5F9",
                    strokeDasharray: "0",
                  },
                }}
                style={{ borderRadius: 16 }}
              />
            </View>
          </View>

          {/* History Header */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <View className="bg-green-600 w-7 h-7 rounded-full items-center justify-center mr-2 border border-green-200">
                <Ionicons name="receipt" size={14} color="#ffffff" />
              </View>
              <Text className="text-lg font-JakartaBold text-green-600">Lịch sử thu nhập</Text>
            </View>

            <TouchableOpacity
              onPress={() => setShowTodayOnly(!showTodayOnly)}
              className={`px-4 py-1.5 rounded-full border flex-row items-center ${!showTodayOnly ? 'bg-green-600 border-green-600' : 'bg-white border-green-600'}`}
            >
              <Ionicons
                name={showTodayOnly ? "list-outline" : "calendar-outline"}
                size={18}
                color={!showTodayOnly ? "white" : "#059669"}
                style={{ marginRight: 4 }}
              />
              <Text className={`font-JakartaBold text-base ${!showTodayOnly ? 'text-white' : 'text-green-600'}`}>
                {showTodayOnly ? 'Hiện tất cả' : 'Xem hôm nay'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Summary Card (Adaptive: Today or Week) */}
          <View
            className="flex-row items-center shadow-md mb-4"
            style={{
              padding: 16,
              borderRadius: 12,
              elevation: 8,
              backgroundColor: "#059669"
            }}
          >
            <View className="bg-white/20 p-3 rounded-2xl mr-4">
              <Ionicons name={showTodayOnly ? "calendar-outline" : "stats-chart-outline"} size={24} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-white/80 font-JakartaSemiBold text-sm uppercase mb-0.5">
                {showTodayOnly ? "Thu nhập hôm nay" : "Thu nhập tuần này"}
              </Text>
              <Text className="text-white font-JakartaExtraBold text-2xl">
                {formatCurrency(showTodayOnly ? todayData.totalIncome : calculatedStats?.totalNet)}
              </Text>
            </View>
            <View className="bg-white/20 px-3 py-1.5 rounded-2xl items-center border border-white/10">
              <Text className="text-white font-JakartaBold text-lg leading-6">
                {showTodayOnly ? todayData.count : calculatedStats?.totalTrips}
              </Text>
              <Text className="text-white/80 font-JakartaMedium text-sm uppercase">Chuyến</Text>
            </View>
          </View>

          {/* Transaction List */}
          {(statsLoading || ordersLoading) && transactions.length === 0 ? (
            <View className="py-20 justify-center items-center">
              <ActivityIndicator color="#059669" size="large" />
              <Text className="text-gray-500 font-JakartaMedium mt-4">Đang tải đơn hàng...</Text>
            </View>
          ) : (showTodayOnly ? todayData.transactions : transactions).length > 0 ? (
            (showTodayOnly ? todayData.transactions : transactions).map((item: any) => renderTransactionItem(item))
          ) : (
            <View className="items-center justify-center py-20 bg-white rounded-[32px] border border-gray-100 border-dashed">
              <Ionicons name="receipt-outline" size={56} color="#E2E8F0" />
              <Text className="text-gray-500 font-JakartaBold text-lg mt-2">
                Không có dữ liệu
              </Text>
              <Text className="text-gray-500 font-JakartaMedium text-base text-center px-10">
                Bạn chưa có đơn hàng hoàn thành nào trong tuần này.
              </Text>
            </View>
          )}

          {/* Spacer */}
          <View className="h-10" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default EarningsScreen;

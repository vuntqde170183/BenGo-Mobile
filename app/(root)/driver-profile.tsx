import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { LinearGradient } from "expo-linear-gradient";

import PageHeader from "@/components/Common/PageHeader";
import { fetchAPI } from "@/lib/fetch";
import { formatCurrencyByLanguage } from "@/lib/currency";
import { DriverProfile as DriverProfileType } from "@/types/type";

export default function DriverProfileScreen() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [driverProfile, setDriverProfile] = useState<DriverProfileType | null>(
    null
  );

  const loadDriverProfile = async () => {
    if (!user?.id) return;
    try {
      const response = await fetchAPI(
        `/(api)/driver/profile?user_id=${user.id}`,
        {
          method: "GET",
        }
      );

      if (response.success) {
        setDriverProfile(response.data);
      } else {
        // Not a driver yet, redirect to registration
        Alert.alert(t("driver.notRegistered"), t("driver.registerFirst"), [
          {
            text: "OK",
            onPress: () => router.replace("/(root)/tabs/profile"),
          },
        ]);
      }
    } catch (error) {
      Alert.alert(t("common.error"), t("driver.loadError"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDriverProfile();
  }, [user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDriverProfile();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return { bg: "#D1FAE5", text: "#10B981", icon: "checkmark-circle" };
      case "pending":
        return { bg: "#FEF3C7", text: "#F59E0B", icon: "time" };
      case "rejected":
        return { bg: "#FEE2E2", text: "#EF4444", icon: "close-circle" };
      case "suspended":
        return { bg: "#E5E7EB", text: "#6B7280", icon: "ban" };
      default:
        return { bg: "#F3F4F6", text: "#6B7280", icon: "help-circle" };
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "approved":
        return t("driver.approved");
      case "pending":
        return t("driver.pending");
      case "rejected":
        return t("driver.rejected");
      case "suspended":
        return t("driver.suspended");
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-general-500 items-center justify-center">
        <Text className="text-gray-500 font-JakartaMedium">
          {t("common.loading")}
        </Text>
      </SafeAreaView>
    );
  }

  if (!driverProfile) {
    return null;
  }

  const statusColor = getStatusColor(driverProfile.approval_status);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <PageHeader title={t("driver.driverProfile")} />
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View className="mx-4 mt-4 bg-white rounded-3xl shadow-sm shadow-neutral-300 overflow-hidden">
          <LinearGradient
            colors={["#10B981", "#059669"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: 16 }}
            className="p-4"
          >
            <View className="flex-row items-center">
              <View 
                className="w-20 h-20 rounded-full bg-white flex items-center justify-center border-4 border-white shadow-xl"
              >
                {driverProfile.profile_image_url ? (
                  <Image
                    source={{ uri: driverProfile.profile_image_url }}
                    className="w-full h-full rounded-full"
                  />
                ) : (
                  <Ionicons name="person" size={40} color="#10B981" />
                )}
              </View>
              <View className="flex-1 ml-4">
                <Text className="text-2xl font-JakartaBold text-neutral-200">
                  {driverProfile.last_name || user?.name} {driverProfile.first_name || ""}
                </Text>
                <View className="flex-row items-center mt-1">
                  <Ionicons name="star" size={16} color="#FCD34D" />
                  <Text className="ml-1 text-neutral-200 font-JakartaBold">
                    {Number(driverProfile.average_rating || 0).toFixed(1)}
                  </Text>
                  <Text className="ml-1 text-neutral-200/80 font-JakartaMedium text-sm">
                    ({driverProfile.rating_count} {t("rating.ratings")})
                  </Text>
                </View>
              </View>
            </View>

            {/* Status Badge */}
            <View
              className="mt-4 px-3 py-1 rounded-full self-start"
              style={{ backgroundColor: statusColor.bg }}
            >
              <View className="flex-row items-center">
                <Ionicons
                  name={statusColor.icon as any}
                  size={16}
                  color={statusColor.text}
                />
                <Text
                  className="ml-2 font-JakartaBold"
                  style={{ color: statusColor.text }}
                >
                  {getStatusText(driverProfile.approval_status)}
                </Text>
              </View>
            </View>
          </LinearGradient>

          {/* Stats Grid */}
          <View className="flex-row flex-wrap p-3 items-stretch">
            <View className="w-1/2 p-2">
              <View className="bg-blue-50 p-4 rounded-2xl border border-blue-300">
                <Ionicons name="car-outline" size={20} color="#3B82F6" />
                <Text className="mt-2 text-xl font-JakartaBold text-blue-900">
                  {driverProfile.completed_rides}
                </Text>
                <Text className="text-sm font-JakartaMedium text-blue-700">
                  {t("driver.completedRides")}
                </Text>
              </View>
            </View>

            <View className="w-1/2 p-2">
              <View className="bg-green-50 p-4 rounded-2xl border border-green-300">
                <Ionicons name="cash-outline" size={20} color="#10B981" />
                <Text className="mt-2 text-xl font-JakartaBold text-green-900">
                  {formatCurrencyByLanguage(
                    driverProfile.total_earnings,
                    i18n.language
                  )}
                </Text>
                <Text className="text-sm font-JakartaMedium text-green-700">
                  {t("driver.totalEarnings")}
                </Text>
              </View>
            </View>

            <View className="w-1/2 p-2">
              <View className="bg-purple-50 p-4 rounded-2xl border border-purple-300">
                <Ionicons name="calendar-outline" size={20} color="#8B5CF6" />
                <Text className="mt-2 text-xl font-JakartaBold text-purple-900">
                  {driverProfile.recentRides?.length || 0}
                </Text>
                <Text className="text-sm font-JakartaMedium text-purple-700">
                  {t("driver.recentRides")}
                </Text>
              </View>
            </View>

            <View className="w-1/2 p-2">
              <View className="bg-orange-50 p-4 rounded-2xl border border-orange-300">
                <Ionicons
                  name="trending-up-outline"
                  size={20}
                  color="#F97316"
                />
                <Text className="mt-2 text-xl font-JakartaBold text-orange-900">
                  {driverProfile.recentRatings?.length || 0}
                </Text>
                <Text className="text-sm font-JakartaMedium text-orange-700">
                  {t("driver.recentRatings")}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Vehicle Info */}
        <View className="mx-4 mt-4 bg-white rounded-3xl shadow-sm shadow-neutral-300 p-4">
          <Text className="text-lg font-JakartaBold mb-4">
            {t("driver.vehicleInfo")}
          </Text>

          {driverProfile.car_image_url && (
            <Image
              source={{ uri: driverProfile.car_image_url }}
              className="w-full h-48 rounded-2xl mb-4"
              resizeMode="cover"
            />
          )}

          <View>
            <View className="flex-row items-center py-3 border-b border-gray-100">
              <View className="w-10 h-10 items-center justify-center bg-green-50 rounded-full">
                <Ionicons name="car-sport-outline" size={20} color="#22c55e" />
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-sm text-gray-500 font-JakartaMedium">
                  {t("driver.vehicleType")}
                </Text>
                <Text className="text-base font-JakartaBold text-gray-900 capitalize">
                  {driverProfile.vehicle_type}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center py-3 border-b border-gray-100">
              <View className="w-10 h-10 items-center justify-center bg-green-50 rounded-full">
                <Ionicons name="people-outline" size={20} color="#22c55e" />
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-sm text-gray-500 font-JakartaMedium">
                  {t("booking.seats")}
                </Text>
                <Text className="text-base font-JakartaBold text-gray-900">
                  {driverProfile.car_seats} {t("booking.seats")}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center py-3">
              <View className="w-10 h-10 items-center justify-center bg-green-50 rounded-full">
                <Ionicons name="card-outline" size={20} color="#22c55e" />
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-sm text-gray-500 font-JakartaMedium">
                  {t("driver.licenseNumber")}
                </Text>
                <Text className="text-base font-JakartaBold text-gray-900">
                  {driverProfile.license_number}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Contact Info */}
        <View className="mx-4 mt-4 mb-4 bg-white rounded-3xl shadow-sm shadow-neutral-300 p-4">
          <Text className="text-lg font-JakartaBold mb-4">
            {t("driver.contactInfo")}
          </Text>

          <View>
            <View className="flex-row items-center py-3 border-b border-gray-100">
              <View className="w-10 h-10 items-center justify-center bg-green-50 rounded-full">
                <Ionicons name="mail-outline" size={20} color="#10B981" />
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-sm text-gray-500 font-JakartaMedium">
                  {t("profile.email")}
                </Text>
                <Text className="text-base font-JakartaBold text-gray-900">
                  {driverProfile.email || user?.email}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center py-3">
              <View className="w-10 h-10 items-center justify-center bg-green-50 rounded-full">
                <Ionicons name="call-outline" size={20} color="#10B981" />
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-sm text-gray-500 font-JakartaMedium">
                  {t("profile.phone")}
                </Text>
                <Text className="text-base font-JakartaBold text-gray-900">
                  {driverProfile.phone}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

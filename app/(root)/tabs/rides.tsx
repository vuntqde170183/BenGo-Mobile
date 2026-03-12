import RideCard from "@/components/Ride/RideCard";
import { images } from "@/constants";
import { fetchAPI } from "@/lib/fetch";
import { Ride } from "@/types/type";
import { useAuth } from "@/context/AuthContext";
import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import {
  Alert,
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RidesScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const userId = user?.id;
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDriver, setIsDriver] = useState(false);

  const fetchRides = async () => {
    if (!userId) {
      return;
    }

    try {
      setError(null);
      const timestamp = Date.now();
      const url = `/(api)/ride/list?user_id=${userId}&status=all&limit=50&offset=0&_t=${timestamp}`;
      const response = await fetchAPI(url);
      setRides(response.data || []);
      const userIsDriver = !!response.isDriver;
      setIsDriver(userIsDriver);

      // Log chuyến đi gần nhất
      if (response.data && response.data.length > 0) {
      } else {
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.networkError"));
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRides();
    setRefreshing(false);
  };

  const handleCancelRide = async (rideId: number) => {
    if (!userId) {
      Alert.alert(
        t("common.error"),
        t("errors.authRequired") || "Vui lòng đăng nhập lại"
      );
      return;
    }
    try {
      const response = await fetchAPI(`/(api)/ride/cancel`, {
        method: "PUT",
        body: JSON.stringify({
          ride_id: rideId,
          user_id: userId,
          reason: t("ride.cancelled"),
        }),
      });

      if (response.success) {
        await fetchRides();
      } else {
        Alert.alert(
          t("common.error"),
          response.error || t("errors.somethingWentWrong")
        );
      }
    } catch (err) {
      Alert.alert(
        t("common.error"),
        err instanceof Error ? err.message : t("errors.somethingWentWrong")
      );
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchRides();
      const refreshInterval = setInterval(() => {
        fetchRides();
      }, 4000);

      return () => {
        clearInterval(refreshInterval);
      };
    }, [userId])
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <SafeAreaView className="flex-1 bg-general-500">
          <FlatList
            data={rides}
            renderItem={({ item }) => (
              <RideCard
                ride={item}
                onCancel={
                  (item.ride_status === "pending" ||
                    item.ride_status === "confirmed" ||
                    item.ride_status === "driver_arrived") &&
                   item.ride_id
                    ? () => handleCancelRide(Number(item.ride_id))
                    : undefined
                }
                onRatingSubmitted={fetchRides}
                onStatusUpdated={fetchRides}
              />
            )}
            keyExtractor={(item) => item.ride_id?.toString() || "0"}
            className="px-4"
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={{
              paddingBottom: 100,
            }}
            ListEmptyComponent={() => (
              <View className="flex flex-col justify-center items-center mt-20">
                {loading ? (
                  <ActivityIndicator size="large" color="#000" />
                ) : error ? (
                  <>
                    <Image
                      source={images.noResult}
                      className="w-40 h-40"
                      alt={t("errors.somethingWentWrong")}
                      resizeMode="contain"
                    />
                    <Text className="mt-4 text-sm text-red-500">{error}</Text>
                  </>
                ) : (
                  <>
                    <Image
                      source={images.noResult}
                      className="w-40 h-40"
                      alt={t("ride.noRidesFound")}
                      resizeMode="contain"
                    />
                    <Text className="mt-4 text-base font-JakartaBold">
                      {t("ride.noRidesFound")}
                    </Text>
                  </>
                )}
              </View>
            )}
            ListHeaderComponent={
              <>
                <Text className="mt-4 mb-2 text-xl font-JakartaBold">
                  {isDriver ? t("ride.customerBookings") : t("ride.myRides")}
                </Text>
                {rides.length > 0 && (
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="car-outline" size={20} color="#16a34a" />
                    <Text className="ml-2 text-base font-bold text-green-600">
                      {rides.length} {t("ride.trips")}
                    </Text>
                  </View>
                )}
              </>
            }
          />
        </SafeAreaView>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

import GoogleTextInput from "@/components/Common/GoogleTextInput";
import DriverMap from "@/components/Common/DriverMap";
import PassengerMap from "@/components/Common/PassengerMap";
import AdditionalServices from "@/components/Home/AdditionalServices";
import Features from "@/components/Home/Features";
import PolygonLuminary from "@/components/Home/PolygonLuminary";
import QuickActions from "@/components/Home/QuickActions";
import PromoSection from "@/components/Home/PromoSection";
import { icons } from "@/constants";
import { fetchAPI } from "@/lib/fetch";
import { useLocationStore } from "@/store";
import { useAuth } from "@/context/AuthContext";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

export default function HomeScreen() {
  const { t } = useTranslation();
  const {
    setUserLocation,
    setDestinationLocation,
    destinationLatitude: storeDestinationLatitude,
  } = useLocationStore();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [hasPermissions, setHasPermissions] = useState(false);
  const insets = useSafeAreaInsets();
  const googleInputRef = useRef<any>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const handleSignOut = () => {
    logout();
    router.replace("/(auth)/sign-in");
  };

  const [lastRide, setLastRide] = useState<any>(null);
  const [isDriver, setIsDriver] = useState(false);

  const handleDestinationPress = (location: {
    latitude: number;
    longitude: number;
    address: string;
  }) => {
    setDestinationLocation(location);

    router.push("/(root)/find-ride");
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) return;
      try {
        const response = await fetchAPI(`/(api)/user/${user.id}`, {
          method: "GET",
        });

        if (response.success && response.data) {
          setUserData(response.data);
        }
      } catch (error) {}
    };

    const checkDriverAndFetchLastRide = async () => {
      if (!user?.id) return;

      try {
        // Check if user is a driver
        const driverRes = await fetchAPI(
          `/(api)/driver/profile?user_id=${user.id}`,
          {
            method: "GET",
          }
        );

        if (driverRes.success && driverRes.data?.id) {
          setIsDriver(true);

          const ridesRes = await fetchAPI(
            `/(api)/ride/list?user_id=${user.id}&limit=10`,
            {
              method: "GET",
            }
          );

          if (ridesRes.success && ridesRes.data && ridesRes.data.length > 0) {
            // Find the most recent ride that is NOT cancelled or no_show
            const validRide = ridesRes.data.find(
              (ride: any) =>
                ride.ride_status !== "cancelled" &&
                ride.ride_status !== "no_show"
            );
            setLastRide(validRide || null);
          } else {
            setLastRide(null);
          }
        } else {
          setIsDriver(false);
          setLastRide(null);
        }
      } catch (error: any) {
        if (error.message && error.message.includes("404")) {
          setIsDriver(false);
        } else {
          console.error("Error fetching driver data or last ride:", error);
        }
      }
    };

    // Initial fetch
    fetchUserData();
    checkDriverAndFetchLastRide();

    // Set up interval to fetch every 4 seconds only if user is a driver
    let intervalId: ReturnType<typeof setInterval> | null = null;

    // Check if driver after initial fetch, then start interval
    const startInterval = async () => {
      if (!user?.id) return;

      try {
        const driverRes = await fetchAPI(
          `/(api)/driver/profile?user_id=${user.id}`,
          { method: "GET" }
        );

        if (driverRes.success && driverRes.data?.id) {
          // Only start interval if user is a driver
          intervalId = setInterval(() => {
            fetchUserData();
            checkDriverAndFetchLastRide();
          }, 4000);
        }
      } catch (error) {
        // Not a driver, no interval needed
        // Still fetch user data once if not fetched
        fetchUserData();
      }
    };

    startInterval();

    // Cleanup interval when component unmounts or user changes
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [user]);

  useEffect(() => {
    const requestLocation = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          setHasPermissions(false);
          return;
        }

        let location = await Location.getCurrentPositionAsync();
        let addressString = t("common.currentLocation");

        const maxRetries = 3;
        let retryCount = 0;

        while (retryCount < maxRetries) {
          try {
            const address = await Location.reverseGeocodeAsync({
              latitude: location.coords?.latitude!,
              longitude: location.coords?.longitude!,
            });

            if (address && address.length > 0) {
              addressString =
                `${address[0].name || ""}, ${address[0].region || ""}`.replace(
                  /^, |, $/,
                  ""
                ) || t("common.currentLocation");
            }
            break;
          } catch (geocodeError) {
            retryCount++;
            if (retryCount < maxRetries) {
              await new Promise((resolve) =>
                setTimeout(resolve, Math.pow(2, retryCount) * 1000)
              );
            }
          }
        }
        setUserLocation({
          latitude: location.coords?.latitude || 21.0379,
          longitude: location.coords?.longitude || 105.8342,
          address: addressString,
        });

        setHasPermissions(true);
        setLoading(false);
      } catch (error) {
        setHasPermissions(false);

        setUserLocation({
          latitude: 21.0379,
          longitude: 105.8342,
          address: "Hà Nội, Việt Nam",
        });

        setLoading(false);
      }
    };

    requestLocation();
  }, []);

  return (
      <SafeAreaView className="flex-1 bg-general-500">
        <View className="px-4">
          {/* Header */}
          <View className="flex flex-row justify-between items-center my-4">
            <Text className="text-2xl capitalize font-JakartaExtraBold text-secondary-900">
              {t("home.greeting")}
              {", "}
              {userData?.name || user?.name}
              {""}👋
            </Text>
            <TouchableOpacity
              onPress={handleSignOut}
              className="justify-center items-center w-10 h-10 bg-white rounded-full shadow-sm"
            >
              <Image source={icons.out} className="w-4 h-4" />
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <GoogleTextInput
            icon={icons.search}
            containerStyle="bg-white shadow-md shadow-neutral-300"
            handlePress={handleDestinationPress}
          />

          {/* Current Location Map */}
          <View className="mt-4">
            <Text className="mb-4 text-xl font-JakartaBold text-secondary-900">
              {t("home.whereTo")}
            </Text>
            <View className="flex flex-row items-center bg-transparent h-[300px] rounded-xl rounded-b-none overflow-hidden shadow-sm">
              {isDriver && lastRide && !storeDestinationLatitude ? (
                <DriverMap
                  rideOriginLatitude={Number(lastRide.origin_latitude)}
                  rideOriginLongitude={Number(lastRide.origin_longitude)}
                  rideDestinationLatitude={Number(
                    lastRide.destination_latitude
                  )}
                  rideDestinationLongitude={Number(
                    lastRide.destination_longitude
                  )}
                />
              ) : (
                <PassengerMap />
              )}
            </View>
          </View>
        </View>

        {/* Main Content Container as BottomSheet */}
        <BottomSheet
          ref={bottomSheetRef}
          snapPoints={["44%", "90%"]}
          index={0}
          handleIndicatorStyle={{ backgroundColor: "white" }}
          backgroundStyle={{ backgroundColor: "#16a34a" }}
          enablePanDownToClose={false}
          enableOverDrag={false}
          style={{ zIndex: 60, elevation: 100 }}
        >
          <BottomSheetView style={{ flex: 1, position: "relative" }}>
            {/* Background SVG Image */}
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: "100%",
                height: "100%",
                zIndex: -1,
                opacity: 0.5,
              }}
            >
              <PolygonLuminary />
            </View>
            {/* Bubble Background */}
            <View className="absolute top-0 right-8 w-32 h-32 rounded-full bg-white/10" />
            <View className="absolute left-12 top-24 w-28 h-28 rounded-full bg-white/15" />
            <View className="absolute right-16 bottom-32 w-20 h-20 rounded-full bg-white/10" />
            <View className="absolute left-8 bottom-20 w-36 h-36 rounded-full bg-white/5" />
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{
                padding: 20,
                paddingTop: 0,
                paddingBottom: insets.bottom + 40,
              }}
              showsVerticalScrollIndicator={false}
            >
              {/* Car Image */}
              <View className="flex justify-center items-center">
                <Image
                  source={require("@/assets/images/car.png")}
                  className="w-auto h-[100px]"
                  resizeMode="contain"
                />
              </View>

              <View className="pb-10">
                <QuickActions />
                <Features />
                <AdditionalServices />
              </View>
            </ScrollView>
          </BottomSheetView>
        </BottomSheet>
      </SafeAreaView>
  );
}

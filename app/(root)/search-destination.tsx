import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import * as Location from "expo-location";

import { useLocationStore } from "@/store";
import { useCustomerProfile } from "@/hooks/useCustomer";
import { useAuth } from "@/context/AuthContext";
import { UserProfile } from "@/api/customer";

const googlePlacesApiKey = process.env.EXPO_PUBLIC_GOOGLE_API_KEY!;

const SearchDestinationScreen = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { setDestinationLocation, setUserLocation } = useLocationStore();
  const { data: userData, isLoading: isLoadingProfile } = useCustomerProfile(user?.id || null);
  const [searchQuery, setSearchQuery] = useState("");
  const googlePlacesRef = useRef<any>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    // Manually focus after a short delay to ensure refs are ready
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, []);

  const handleSelectLocation = (data: any, details: any = null) => {
    if (details) {
      setDestinationLocation({
        latitude: details.geometry.location.lat,
        longitude: details.geometry.location.lng,
        address: data.description || details.formatted_address,
      });
      router.push("/(root)/booking-setup");
    }
  };

  const handleCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      let location = await Location.getCurrentPositionAsync({});
      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const addressString = address && address[0]
        ? `${address[0].name || ""}, ${address[0].region || ""}`.replace(/^, |, $/, "")
        : t("common.currentLocation");

      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address: addressString,
      });

      setDestinationLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address: addressString,
      });
      router.push("/(root)/booking-setup");
    } catch (error) {
      console.error("Error getting current location:", error);
    }
  };

  const handleSavedPlace = (place: any) => {
    setDestinationLocation({
      latitude: place.lat,
      longitude: place.lng,
      address: place.fullAddress,
    });
    router.push("/(root)/booking-setup");
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* S1: Search Input Box Header */}
      <View className="flex-row items-center z-[1000] px-5 py-4 border-b border-neutral-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-2">
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <GooglePlacesAutocomplete
            ref={googlePlacesRef}
            placeholder={t("home.whereTo") || "Bạn muốn giao hàng đến đâu?"}
            fetchDetails={true}
            onPress={handleSelectLocation}
            query={{
              key: googlePlacesApiKey,
              language: "vi",
              components: "country:vn",
            }}
            textInputProps={{
              placeholderTextColor: "#9CA3AF",
              onChangeText: (text) => setSearchQuery(text),
              ref: inputRef,
            }}
            renderDescription={(row: any) => row.description}
            styles={customAutocompleteStyles}
            enablePoweredByContainer={false}
            nearbyPlacesAPI="GooglePlacesSearch"
            debounce={400}
            renderRow={((data: any) => (
              <View style={{ paddingVertical: 2 }}>
                <Text style={{ color: "#374151", fontSize: 14 }}>
                  {data.description}
                </Text>
              </View>
            )) as any}
            renderRightButton={() => (
              <TouchableOpacity
                onPress={() => {
                  googlePlacesRef.current?.setAddressText("");
                  setSearchQuery("");
                }}
                style={{ justifyContent: 'center', paddingRight: 12 }}
              >
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          />
        </View>
      </View>

      <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
        {/* S2: Quick Buttons */}
        <View className="px-5 pb-4 border-b border-neutral-100">
          <TouchableOpacity
            onPress={handleCurrentLocation}
            className="flex-row items-center py-3"
          >
            <View className="w-12 h-12 rounded-full bg-green-50 justify-center items-center mr-4">
              <Ionicons name="locate" size={22} color="#10B981" />
            </View>
            <Text className="text-green-600 font-JakartaBold text-base">
              Sử dụng vị trí hiện tại
            </Text>
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center py-3">
            <View className="w-12 h-12 rounded-full bg-green-50 justify-center items-center mr-4">
              <Ionicons name="map" size={22} color="#10B981" />
            </View>
            <Text className="text-green-600 font-JakartaBold text-base">
              Chọn trên bản đồ
            </Text>
          </TouchableOpacity>
        </View>

        {/* S3: Saved Places */}
        <View className="px-5 py-4">
          <Text className="font-JakartaBold mb-4 text-lg text-green-600">
            Địa điểm đã lưu
          </Text>

          {isLoadingProfile ? (
            <ActivityIndicator size="small" color="#10B981" />
          ) : (
            userData?.savedAddresses?.map((item: any, index: number) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleSavedPlace(item)}
                className="flex-row items-center py-4 border-b border-neutral-50"
              >
                <View className="w-10 h-10 rounded-full bg-neutral-100 justify-center items-center mr-4">
                  <Ionicons
                    name={item.type === "home" ? "home" : "briefcase"}
                    size={20}
                    color="#4B5563"
                  />
                </View>
                <View className="flex-1 flex-row">
                  <Text className="text-neutral-500 text-sm" numberOfLines={1}>
                    {item.fullAddress}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}

          {/* Fallback if no specific role for home/work, or just to show icons */}
          {!userData?.savedAddresses?.length && !isLoadingProfile && (
            <Text className="text-neutral-400 text-center py-4 italic">
              Chưa có địa điểm đã lưu
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  rowContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingVertical: 12,
    paddingHorizontal: 2,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  textWrapper: {
    flex: 1,
  },
  mainText: {
    color: "#000000",
    fontSize: 14,
  },
});

const customAutocompleteStyles: any = {
  container: {
    flex: 0, // Quan trọng để không chiếm hết màn hình khi chưa có kết quả
  },
  textInputContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    height: 48,
    alignItems: "center", // Đảm bảo các phần tử bên trong container (như nút Close) được căn giữa
  },
  textInput: {
    backgroundColor: "transparent",
    fontSize: 15,
    color: "#000000",
    flex: 1,
    height: 48, // Đặt chiều cao cố định thay vì 100%
    paddingHorizontal: 12,
    paddingTop: 0,
    paddingBottom: 0,
    textAlignVertical: "center", // Căn giữa chữ theo trục Y trên Android
  },
  listView: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    borderRadius: 8,
    marginTop: 5,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: "absolute",
    top: 48, // Xuất hiện ngay dưới thanh Input
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  row: {
    padding: 13,
    height: 48,
    flexDirection: "row",
  },
  separator: {
    height: 0.5,
    backgroundColor: "#E5E7EB",
  },
  poweredContainer: {
    justifyContent: "flex-end",
    alignItems: "center",
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    paddingVertical: 8,
  },
};

export default SearchDestinationScreen;

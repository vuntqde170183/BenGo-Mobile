import React, { useEffect, useState, useCallback } from "react";
import { View, Dimensions } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { useLocationStore } from "@/store";
import { router } from "expo-router";
import * as Location from "expo-location";
import { useTranslation } from "react-i18next";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { useCustomerProfile } from "@/hooks/useCustomer";

import BackgroundMap from "@/components/Customer/HomeScreen/BackgroundMap";
import FloatingSearchBar from "@/components/Customer/HomeScreen/FloatingSearchBar";
import AddressShortcuts from "@/components/Customer/HomeScreen/AddressShortcuts";
import CustomModal from "@/components/Common/CustomModal";

export default function HomeScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { setUserLocation, setDestinationLocation } = useLocationStore();

  const { data: userData } = useCustomerProfile(user?.id || null);

  const [alertModal, setAlertModal] = useState({
    visible: false,
    title: "",
    message: "",
    onConfirm: undefined as (() => void) | undefined
  });

  const showAlert = (title: string, message: string, onConfirm?: () => void) => {
    setAlertModal({ visible: true, title, message, onConfirm });
  };

  const closeAlert = () => {
    setAlertModal((prev) => ({ ...prev, visible: false }));
    if (alertModal.onConfirm) {
      alertModal.onConfirm();
    }
  };

  const handleSearchPress = () => {
    router.push("/(root)/search-destination");
  };

  const handleShortcutPress = (type: string) => {
    if (userData?.savedAddresses) {
      const address = userData.savedAddresses.find((a: any) => a.type === type);
      if (address) {
        setDestinationLocation({
          latitude: address.lat,
          longitude: address.lng,
          address: address.fullAddress,
        });
        router.push("/(root)/confirm-ride" as any);
        return;
      }
    }
    showAlert("Thông báo", "Địa chỉ này chưa được thiết lập trong hồ sơ.");
  };





  const requestLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      let location = await Location.getCurrentPositionAsync();
      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const addressString = address && address[0]
        ? `${address[0].name || ""}, ${address[0].region || ""}`.replace(/^, |, $/, "")
        : "Vị trí của bạn";

      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address: addressString,
      });
    } catch (error) {
      console.error("Location error:", error);
    }
  };

  useEffect(() => {
    requestLocation();
  }, [user]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: "#F3F4F6" }}>
        <BackgroundMap />
        <FloatingSearchBar onPress={handleSearchPress} />
        <AddressShortcuts
          onPress={handleShortcutPress}
          savedAddresses={userData?.savedAddresses}
        />
      </View>

      <CustomModal
        visible={alertModal.visible}
        title={alertModal.title}
        message={alertModal.message}
        onClose={closeAlert}
      />
    </GestureHandlerRootView>
  );
}

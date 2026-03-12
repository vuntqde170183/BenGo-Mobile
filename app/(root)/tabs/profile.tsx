import { useAuth } from "@/context/AuthContext";
import {
  Image,
  ScrollView,
  Text,
  View,
  ImageBackground,
  RefreshControl,
} from "react-native";
import { Switch } from "react-native-switch";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import { LanguageSwitcher } from "@/components/Common/LanguageSwitcher";
import CustomButton from "@/components/Common/CustomButton";
import { fetchAPI } from "@/lib/fetch";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const { t } = useTranslation();
  const [isDriver, setIsDriver] = useState(false);
  const [driverId, setDriverId] = useState<number | null>(null);
  const [driverApprovalStatus, setDriverApprovalStatus] = useState<
    string | null
  >(null);
  const [isOnline, setIsOnline] = useState(false);
  const [checkingDriver, setCheckingDriver] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  const onRefresh = async () => {
    setRefreshing(true);
    await checkDriverStatus();
    if (!isDriver && user?.id) {
      await fetchUserData();
    }
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      const initProfile = async () => {
        const isDriverUser = await checkDriverStatus();
        if (!isDriverUser && user?.id) {
          await fetchUserData();
        }
      };

      initProfile();
      const intervalId = setInterval(() => {
        initProfile();
      }, 4000);

      return () => {
        clearInterval(intervalId);
      };
    }, [user?.id])
  );

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

  const toggleOnlineStatus = async () => {
    if (!driverId || updatingStatus) return;

    const oldStatus = isOnline;
    const newStatus = !isOnline;
    setIsOnline(newStatus);
    setUpdatingStatus(true);

    try {
      const res = await fetchAPI("/(api)/driver/update-status", {
        method: "PATCH",
        body: JSON.stringify({
          driver_id: driverId,
          new_status: newStatus ? "online" : "offline",
        }),
      });

      if (!res.success) {
        // Rollback on failure
        setIsOnline(oldStatus);
      }
    } catch (error) {
      setIsOnline(oldStatus);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const checkDriverStatus = async () => {
    if (!user?.id) {
      setCheckingDriver(false);
      setIsDriver(false);
      return false;
    }

    try {
      const response = await fetchAPI(
        `/(api)/driver/profile?user_id=${user.id}`,
        { method: "GET" }
      );

      if (response.success && response.data?.id) {
        setIsDriver(true);
        setDriverId(response.data.id);
        setDriverApprovalStatus(response.data.approval_status);
        setIsOnline(response.data.status === "online");
        return true;
      } else {
        setIsDriver(false);
        setDriverId(null);
        setDriverApprovalStatus(null);
        return false;
      }
    } catch (error) {
      setIsDriver(false);
      setDriverId(null);
      setDriverApprovalStatus(null);
      return false;
    } finally {
      setCheckingDriver(false);
    }
  };

  const handleDriverAction = () => {
    if (isDriver) {
      router.push("/(root)/driver-profile");
    } else {
      router.push("/(root)/driver-registration");
    }
  };

  const formatPhoneNumber = (phone: string | null | undefined) => {
    if (!phone) return t("common.notProvided");
    // Chuyển +84 thành 0
    if (phone.startsWith("+84")) {
      return "0" + phone.substring(3);
    }
    return phone;
  };

  const userId = user?.id || "default";
  const backgroundImageUrl = `https://picsum.photos/seed/${userId}/800/400`;
  const handleSignOut = () => {
    logout();
    router.replace("/(auth)/sign-in");
  };
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView className="flex-1 bg-general-500">
        <ScrollView
          className="flex-1 px-4"
          contentContainerStyle={{ paddingBottom: 120 }}
          alwaysBounceVertical={true}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <Text className="my-4 text-xl font-JakartaBold">
            {t("profile.profile")}
          </Text>

          <View className="relative mb-4 shadow-lg bg-white rounded-[24px] border border-gray-200 shadow-neutral-300 overflow-hidden">
            <ImageBackground
              source={{ uri: backgroundImageUrl }}
              style={{ width: "100%", height: 200 }}
              imageStyle={{ borderRadius: 24 }}
            >
              <LinearGradient
                colors={["rgba(0,0,0,0.3)", "rgba(0,0,0,0.6)"]}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 0,
                  bottom: 0,
                  borderRadius: 24,
                }}
              />
              <View className="flex justify-center items-center h-full">
                <View 
                  className="w-[110px] h-[110px] rounded-full bg-green-100 flex items-center justify-center border-4 border-white shadow-xl"
                >
                  <Ionicons name="person" size={60} color="#16a34a" />
                </View>
                <Text className="mt-3 text-xl font-JakartaBold text-neutral-200">
                  {userData?.name || user?.name}
                </Text>
                <Text className="mt-1 text-sm font-JakartaMedium text-neutral-200/80">
                  {user?.email || ""}
                </Text>
              </View>
            </ImageBackground>
          </View>
          {/* Profile Info Section */}
          {isDriver && !checkingDriver ? (
            <>
              <Text className="mb-4 text-xl font-JakartaBold">
                {t("driver.driverDetails")}
              </Text>
              <View className="flex flex-col p-4 mb-4 shadow-sm bg-white rounded-[24px] border border-gray-200 shadow-neutral-300 overflow-hidden">
                <View className="flex-row items-center mb-4">
                  <View className="w-12 h-12 items-center justify-center bg-green-500 rounded-full mr-4">
                    <Ionicons name="car-sport" size={20} color="white" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-JakartaBold text-gray-900">
                      {t("driver.viewProfile")}
                    </Text>
                    <Text className="text-sm font-JakartaMedium text-gray-600">
                      {t("driver.manageDriverAccount")}
                    </Text>
                  </View>
                </View>

                {driverApprovalStatus && (
                  <View className="mb-4 px-4 py-2 bg-gray-100 rounded-xl">
                    <View className="flex-row items-center">
                      <Ionicons
                        name={
                          driverApprovalStatus === "approved"
                            ? "checkmark-circle"
                            : driverApprovalStatus === "pending"
                              ? "time"
                              : "close-circle"
                        }
                        size={20}
                        color={
                          driverApprovalStatus === "approved"
                            ? "#10B981"
                            : driverApprovalStatus === "pending"
                              ? "#F59E0B"
                              : "#EF4444"
                        }
                      />
                      <Text className="ml-2 text-sm font-JakartaBold text-gray-700">
                        {t("common.status")}:{" "}
                        <Text
                          className={
                            driverApprovalStatus === "approved"
                              ? "text-green-600"
                              : driverApprovalStatus === "pending"
                                ? "text-yellow-600"
                                : "text-red-600"
                          }
                        >
                          {driverApprovalStatus === "approved"
                            ? t("driver.approved")
                            : driverApprovalStatus === "pending"
                              ? t("driver.pending")
                              : t("driver.rejected")}
                        </Text>
                      </Text>
                    </View>
                  </View>
                )}

                <View className="flex-row items-center justify-between mb-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <View className="flex-row items-center">
                    <View
                      className={`w-3 h-3 rounded-full mr-2 ${isOnline ? "bg-green-500" : "bg-gray-400"}`}
                    />
                    <Text className="text-base font-JakartaBold text-gray-800">
                      {isOnline ? t("driver.online") : t("driver.offline")}
                    </Text>
                  </View>
                  <Switch
                    value={isOnline}
                    onValueChange={toggleOnlineStatus}
                    disabled={updatingStatus}
                    activeText={t("driver.online")}
                    inActiveText={t("driver.offline")}
                    circleSize={24}
                    barHeight={28}
                    circleBorderWidth={0}
                    backgroundActive={"#10B981"}
                    backgroundInactive={"#D1D5DB"}
                    circleActiveColor={"#FFFFFF"}
                    circleInActiveColor={"#FFFFFF"}
                    changeValueImmediately={true}
                    renderActiveText={false}
                    renderInActiveText={false}
                    switchLeftPx={2}
                    switchRightPx={2}
                    switchWidthMultiplier={2}
                  />
                </View>

                {driverApprovalStatus === "rejected" ? (
                  <CustomButton
                    title={t("driver.editRegistration")}
                    onPress={() => router.push("/(root)/driver-registration")}
                    bgVariant="danger"
                    IconRight={() => (
                      <Ionicons
                        name="create-outline"
                        size={20}
                        color="white"
                        style={{ marginLeft: 8 }}
                      />
                    )}
                  />
                ) : (
                  <CustomButton
                    title={t("driver.viewProfile")}
                    onPress={handleDriverAction}
                    bgVariant="primary"
                    IconRight={() => (
                      <Ionicons
                        name="person-outline"
                        size={20}
                        color="white"
                        style={{ marginLeft: 8 }}
                      />
                    )}
                  />
                )}
              </View>
            </>
          ) : (
            <>
              <Text className="mb-4 text-xl font-JakartaBold">
                {t("profile.profileInfo")}
              </Text>
              <View className="flex flex-col shadow-sm mb-4 p-2 bg-white rounded-[24px] border border-gray-200 shadow-neutral-300 overflow-hidden">
                {/* Name Item */}
                <View className="flex flex-row items-center px-4 py-3 border-b border-gray-100">
                  <View className="w-10 h-10 items-center justify-center bg-neutral-50 rounded-full mr-4">
                    <Ionicons name="person-outline" size={20} color="#10B981" />
                  </View>
                  <View className="flex flex-col flex-1">
                    <Text className="text-base text-neutral-400 font-JakartaMedium">
                      {t("profile.name")}
                    </Text>
                    <Text className="text-base font-JakartaBold text-neutral-800">
                      {userData?.name || user?.name}
                    </Text>
                  </View>
                </View>

                {/* Email Item */}
                <View className="flex flex-row items-center px-4 py-3 border-b border-gray-100">
                  <View className="w-10 h-10 items-center justify-center bg-neutral-50 rounded-full mr-4">
                    <Ionicons name="mail-outline" size={20} color="#10B981" />
                  </View>
                  <View className="flex flex-col flex-1">
                    <Text className="text-base text-neutral-400 font-JakartaMedium">
                      {t("profile.email")}
                    </Text>
                    <Text className="text-base font-JakartaBold text-neutral-800">
                      {user?.email || t("common.notProvided")}
                    </Text>
                  </View>
                </View>

                {/* Phone Item */}
                <View className="flex flex-row items-center px-4 py-3">
                  <View className="w-10 h-10 items-center justify-center bg-neutral-50 rounded-full mr-4">
                    <Ionicons name="call-outline" size={20} color="#10B981" />
                  </View>
                  <View className="flex flex-col flex-1">
                    <Text className="text-base text-neutral-400 font-JakartaMedium">
                      {t("profile.phone")}
                    </Text>
                    <Text className="text-base font-JakartaBold text-neutral-800">
                      {formatPhoneNumber(userData?.phone || user?.phone)}
                    </Text>
                  </View>
                </View>
              </View>
            </>
          )}

          <Text className="mb-4 text-xl font-JakartaBold">
            {t("profile.settings")}
          </Text>
          <View className="flex flex-col p-4 mb-4 shadow-sm bg-white rounded-[24px] border border-gray-200 shadow-neutral-300 overflow-hidden">
            <LanguageSwitcher />
          </View>

          {!isDriver && !checkingDriver && (
            <>
              <Text className="mb-4 text-xl font-JakartaBold">
                {t("driver.driverMode")}
              </Text>
              <View className="flex flex-col p-4 mb-4 shadow-sm bg-white rounded-[24px] border border-gray-200 shadow-neutral-300 overflow-hidden">
                <View className="flex-row items-center mb-4">
                  <View className="w-12 h-12 items-center justify-center bg-green-500 rounded-full mr-4">
                    <Ionicons name="car-sport" size={20} color="white" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-JakartaBold text-gray-900">
                      {t("driver.becomeDriver")}
                    </Text>
                    <Text className="text-sm font-JakartaMedium text-gray-600">
                      {t("driver.earnMoney")}
                    </Text>
                  </View>
                </View>

                <CustomButton
                  title={t("driver.registerNow")}
                  onPress={handleDriverAction}
                  bgVariant="success"
                  IconRight={() => (
                    <Ionicons
                      name="add-circle-outline"
                      size={20}
                      color="white"
                      style={{ marginLeft: 8 }}
                    />
                  )}
                />
              </View>
            </>
          )}

          <CustomButton
            title={t("profile.logout")}
            bgVariant="danger"
            onPress={handleSignOut}
            IconRight={() => (
              <Ionicons
                name="log-out-outline"
                size={20}
                color="white"
                style={{ marginLeft: 8 }}
              />
            )}
          />
        </ScrollView>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

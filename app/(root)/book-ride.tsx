import Payment from "@/components/Ride/Payment";
import RideLayout from "@/components/Ride/RideLayout";
import PageHeader from "@/components/Common/PageHeader";
import { icons } from "@/constants";
import { formatTime } from "@/lib/utils";
import { useDriverStore, useLocationStore, usePromoStore } from "@/store";
import { useAuth } from "@/context/AuthContext";
import { StripeProvider } from "@stripe/stripe-react-native";
import { Image, Text, View, Alert, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useMemo, useCallback } from "react";
import { fetchAPI } from "@/lib/fetch";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const BookRide = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const {
    userAddress,
    destinationAddress,
    userLatitude,
    userLongitude,
    destinationLatitude,
    destinationLongitude,
  } = useLocationStore();
  const { drivers, selectedDriver } = useDriverStore();
  const { selectedPromo, clearSelectedPromo } = usePromoStore();

  const driverDetails = useMemo(
    () => drivers?.filter((driver) => +driver.id === selectedDriver)[0],
    [drivers, selectedDriver]
  );

  const [promoCode, setPromoCode] = useState("");
  const [discountInfo, setDiscountInfo] = useState<{
    amount: number;
    finalPrice: number;
    code: string;
    id: number;
  } | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const validateAndApplyPromo = useCallback(
    async (code: string) => {
      if (!user?.id || !driverDetails?.price) {
        return;
      }

      try {
        setIsValidating(true);

        const requestPayload = {
          code: code,
          user_id: user.id,
          ride_amount: parseFloat(driverDetails.price || "0"),
        };

        const response = await fetchAPI("/(api)/promo/validate", {
          method: "POST",
          body: JSON.stringify(requestPayload),
        });

        if (response.success) {
          setDiscountInfo({
            amount: response.data.discount_amount,
            finalPrice: response.data.final_amount,
            code: code,
            id: response.data.promo_code_id,
          });
          setPromoCode(code);
        } else {
          setDiscountInfo(null);
          Alert.alert(t("common.error"), response.error || t("promo.notFound"));
        }
      } catch (error) {
        Alert.alert(t("common.error"), t("errors.somethingWentWrong"));
        setDiscountInfo(null);
      } finally {
        setIsValidating(false);
      }
    },
    [user?.id, driverDetails?.price, t]
  );

  useEffect(() => {
    if (selectedPromo && driverDetails) {
      validateAndApplyPromo(selectedPromo.code);
    }
  }, [selectedPromo, driverDetails, validateAndApplyPromo]);

  const currentPrice = useMemo(
    () =>
      discountInfo
        ? discountInfo.finalPrice
        : parseFloat(driverDetails?.price || "0"),
    [discountInfo, driverDetails?.price]
  );

  const snapPoints = useMemo(() => ["40%", "85%"], []);

  try {
    return (
      <StripeProvider
        publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!}
        merchantIdentifier="merchant.com.uber"
        urlScheme="BenGo"
      >
        <SafeAreaView className="flex-1 bg-general-500" edges={["top"]}>
          <PageHeader title={t("ride.rideDetails")} />
          <RideLayout snapPoints={snapPoints} scrollable={false}>
            <>
              <View className="flex flex-col justify-center items-center w-full -mt-2">
                <Image
                  source={{ uri: driverDetails?.profile_image_url }}
                  className="w-24 h-24 rounded-full"
                />

                <View className="flex flex-row justify-center items-center mt-2 space-x-2">
                  <Text className="text-lg font-JakartaSemiBold">
                    {driverDetails?.title}
                  </Text>

                  <View className="flex flex-row items-center space-x-0.5">
                    <Image
                      source={icons.star}
                      className="w-5 h-5"
                      resizeMode="contain"
                    />
                    <Text className="text-lg font-JakartaRegular">
                      {driverDetails?.rating}
                    </Text>
                  </View>
                </View>
              </View>

              <View className="flex flex-col justify-center items-start p-4 mt-4 w-full rounded-[24px] bg-green-50">
                <View className="flex flex-row justify-between items-center py-3 pt-0 w-full border-b-[1px] border-green-200">
                  <Text className="text-lg font-JakartaRegular">
                    {t("ride.fare")}
                  </Text>
                  <View className="items-end">
                    {discountInfo && (
                      <Text className="text-sm font-JakartaMedium text-gray-500 line-through">
                        {Number(driverDetails?.price).toLocaleString("vi-VN")}{" "}
                        VNĐ
                      </Text>
                    )}
                    <Text className="text-lg font-JakartaRegular text-green-600">
                      {currentPrice.toLocaleString("vi-VN")} VNĐ
                    </Text>
                  </View>
                </View>

                <View className="flex flex-row justify-between items-center py-3 w-full border-b-[1px] border-green-200">
                  <Text className="text-lg font-JakartaRegular">
                    {t("booking.estimatedTime")}
                  </Text>
                  <Text className="text-lg font-JakartaRegular">
                    {formatTime(driverDetails?.time!)}
                  </Text>
                </View>

                <View className="flex flex-row justify-between items-center py-3 pb-0 w-full">
                  <Text className="text-lg font-JakartaRegular capitalize">
                    {t("booking.seats")}
                  </Text>
                  <Text className="text-lg font-JakartaRegular">
                    {driverDetails?.car_seats}
                  </Text>
                </View>
              </View>

              <View className="flex flex-col justify-center items-start w-full">
                <View className="flex flex-row justify-start items-center py-3 mt-4 w-full border-t border-b border-general-700">
                  <Image source={icons.to} className="w-6 h-6" />
                  <Text className="ml-2 text-lg font-JakartaRegular">
                    {userAddress}
                  </Text>
                </View>

                <View className="flex flex-row justify-start items-center py-3 w-full border-b border-general-700">
                  <Image source={icons.point} className="w-6 h-6" />
                  <Text className="ml-2 text-lg font-JakartaRegular">
                    {destinationAddress}
                  </Text>
                </View>
              </View>

              {/* Promo Code Section */}
              {discountInfo ? (
                <View className="mt-2 p-4 py-3 bg-green-50 rounded-2xl border border-green-200">
                  <View className="flex-row items-center justify-between">
                    {/* Left: Icon + Code */}
                    <View className="flex-row items-center flex-shrink">
                      <Ionicons name="pricetag" size={18} color="#16A34A" />
                      <Text className="ml-2 text-base font-JakartaBold text-green-600">
                        {discountInfo.code}
                      </Text>
                    </View>

                    {/* Center: Savings */}
                    <Text className="text-sm font-JakartaMedium text-green-600 flex-1 text-center">
                      -{discountInfo.amount.toLocaleString("vi-VN")}₫
                    </Text>

                    {/* Right: Cancel Button */}
                    <TouchableOpacity
                      onPress={() => {
                        setDiscountInfo(null);
                        setPromoCode("");
                        clearSelectedPromo();
                      }}
                      className="bg-red-500 py-2 px-3 rounded-lg flex flex-row items-center"
                    >
                      <Text className="text-white font-JakartaBold text-sm mr-1">
                        {t("common.cancel")}
                      </Text>
                      <Ionicons name="trash-outline" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View className="mt-2 flex flex-row justify-between items-center">
                  <Text className="text-lg font-JakartaSemiBold">
                    {t("promo.selectPromoCode")}
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push("/(root)/promos?mode=select")}
                    className="flex flex-row items-center"
                  >
                    <Text className="text-primary-600 text-lg font-JakartaBold">
                      {t("promo.viewAvailableCodes")}
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="#16A34A"
                      className="mt-1"
                    />
                  </TouchableOpacity>
                </View>
              )}

              <Payment
                fullName={user?.name!}
                email={user?.email!}
                amount={currentPrice.toString()}
                driverId={driverDetails?.id!}
                rideTime={driverDetails?.time!}
                originAddress={userAddress!}
                destinationAddress={destinationAddress!}
                originLatitude={userLatitude!}
                originLongitude={userLongitude!}
                destinationLatitude={destinationLatitude!}
                destinationLongitude={destinationLongitude!}
              />
            </>
          </RideLayout>
        </SafeAreaView>
      </StripeProvider>
    );
  } catch (error) {
    return (
      <SafeAreaView className="flex-1 bg-general-500" edges={["top"]}>
        <PageHeader title={t("ride.rideDetails")} />
        <View className="flex-1 items-center justify-center p-4">
          <Text className="text-lg font-JakartaMedium text-red-600">
            Render Error: {String(error)}
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-4 bg-green-500 px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-JakartaBold">
              {t("common.goBack")}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
};

export default BookRide;

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  Keyboard,
  Platform,
  TouchableWithoutFeedback,
  Alert,
} from "react-native";
import { StarRating } from "../../Common/StarRating";
import { useAuth } from "@/context/AuthContext";
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import CustomButton from "../../Common/CustomButton";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { fetchAPI } from "@/lib/fetch";
import { formatCurrencyByLanguage } from "@/lib/currency";

interface RatingModalProps {
  visible: boolean;
  onClose: () => void;
  ride: {
    ride_id: number;
    driver_id: number;
    fare_price?: string | number; // Fare in VND from database
    driver: {
      first_name: string;
      last_name: string;
      profile_image_url?: string;
    };
  };
  onRatingSubmitted?: () => void;
}

export const RatingModal: React.FC<RatingModalProps> = ({
  visible,
  onClose,
  ride,
  onRatingSubmitted,
}) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  useEffect(() => {
    if (visible) {
      bottomSheetModalRef.current?.present();
    } else {
      bottomSheetModalRef.current?.dismiss();
    }
  }, [visible]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    []
  );

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert(t("common.error"), t("rating.pleaseLogin"));
      return;
    }

    const apiEndpoint = "/(api)/rating/create";
    const requestPayload = {
      ride_id: ride.ride_id,
      user_id: user.id,
      driver_id: ride.driver_id,
      stars,
      comment: comment.trim() || null,
    };
    setLoading(true);

    const startTime = Date.now();
    try {
      const data = await fetchAPI(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestPayload),
      });

      const endTime = Date.now();

      if (data.success) {
        Alert.alert(t("common.success"), t("rating.thankYou"), [
          {
            text: "OK",
            onPress: () => {
              onClose();
              onRatingSubmitted?.();
            },
          },
        ]);
      } else {
        Alert.alert(t("common.error"), data.error || t("rating.cannotSubmit"));
      }
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      const err = error as Error;
      Alert.alert(
        t("common.error"),
        `${t("rating.submitError")}\n\nDebug: ${err?.message || "Unknown error"}`
      );
    } finally {
      const finalTime = Date.now();
      const totalDuration = finalTime - startTime;
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      Keyboard.dismiss();
      setStars(5);
      setComment("");
      onClose();
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      snapPoints={["75%", "90%"]}
      enablePanDownToClose
      onDismiss={handleClose}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{
        backgroundColor: "#D1D5DB",
        width: 40,
        height: 4,
      }}
    >
      <BottomSheetView className="flex-1 px-4 pb-10">
        {/* Header */}
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-xl font-JakartaBold text-gray-800">
            {t("rating.rateYourRide")}
          </Text>
        </View>

        {/* Driver Info */}
        <View className="items-center mb-4">
          <Image
            source={{
              uri:
                ride.driver.profile_image_url ||
                "https://via.placeholder.com/80",
            }}
            className="w-20 h-20 rounded-full mb-3 bg-gray-200"
          />
          <Text className="text-xl font-JakartaBold text-gray-800 mb-1">
            {t("ride.driverPrefix")}
            {ride.driver.first_name} {ride.driver.last_name}
          </Text>
          <Text className="text-base font-JakartaMedium text-gray-500">
            {t("rating.howWasYourTrip")}
          </Text>
          {/* Display fare with proper currency conversion */}
          {ride.fare_price && (
            <View className="mt-2 px-4 py-1 bg-green-50 rounded-full flex-row items-center border border-green-200">
              <Ionicons
                name="wallet-outline"
                size={20}
                color="#15803D"
                style={{ marginRight: 8 }}
              />
              <Text className="text-base font-JakartaBold text-green-700">
                {formatCurrencyByLanguage(ride.fare_price, i18n.language)}
              </Text>
            </View>
          )}
        </View>

        {/* Star Rating */}
        <View className="items-center mb-4 py-3">
          <StarRating
            rating={stars}
            onRatingChange={setStars}
            size={48}
            color="#FFD700"
          />
        </View>

        {/* Comment Input */}
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <View className="mb-4">
            <Text className="text-base font-JakartaBold text-gray-700 mb-2">
              {t("rating.leaveComment")}
            </Text>
            <TextInput
              className="border border-gray-300 rounded-xl p-4 text-base font-Jakarta text-gray-800 min-h-[100px]"
              placeholder={t("rating.shareExperience")}
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              value={comment}
              onChangeText={setComment}
              maxLength={500}
              editable={!loading}
              style={{ textAlignVertical: "top" }}
              returnKeyType="done"
              blurOnSubmit={true}
              onSubmitEditing={dismissKeyboard}
            />
            <Text className="text-sm font-JakartaMedium text-gray-400 text-right mt-1">
              {comment.length}/500 {t("rating.characterLimit")}
            </Text>
          </View>
        </TouchableWithoutFeedback>

        <CustomButton
          title={t("rating.submitRating")}
          onPress={handleSubmit}
          disabled={loading}
        />
      </BottomSheetView>
    </BottomSheetModal>
  );
};

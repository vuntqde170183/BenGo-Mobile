import { icons } from "@/constants";
import { router } from "expo-router";
import { useCallback } from "react";
import { Image, Text, View, Alert } from "react-native";
import CustomButton from "./CustomButton";
import { useTranslation } from "react-i18next";

const OAuth = () => {
  const { t } = useTranslation();

  const handleGoogleSignIn = useCallback(async () => {
    Alert.alert(t("common.info"), "Google Sign-In is temporarily unavailable.");
  }, [t]);

  return (
    <View>
      <View className="flex flex-row gap-x-4 justify-center items-center mt-4">
        <View className="h-[1px] bg-general-100 flex-1" />
        <Text className="text-lg">{t("auth.or")}</Text>
        <View className="h-[1px] bg-general-100 flex-1" />
      </View>

      <CustomButton
        title={t("auth.signInWithGoogle")}
        className="mt-5 w-full shadow-none"
        IconLeft={() => (
          <Image
            source={icons.google}
            resizeMode="contain"
            className="mx-2 w-5 h-5"
          />
        )}
        bgVariant="outline"
        textVariant="primary"
        onPress={handleGoogleSignIn}
      />
    </View>
  );
};

export default OAuth;

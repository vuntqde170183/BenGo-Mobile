import { Image, View, ActivityIndicator, TextInput, Text } from "react-native";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { useTranslation } from "react-i18next";
import { useState, useRef, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";

import { icons } from "@/constants";
import { GoogleInputProps } from "@/types/type";

const googlePlacesApiKey = process.env.EXPO_PUBLIC_GOOGLE_API_KEY!;

const GoogleTextInput = ({
  icon,
  initialLocation,
  containerStyle,
  textInputBackgroundColor,
  handlePress,
  userLatitude,
  userLongitude,
}: GoogleInputProps) => {
   const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const placesRef = useRef<any>(null);
  const textInputRef = useRef<any>(null);

  useEffect(() => {
    if (initialLocation && placesRef.current) {
      placesRef.current?.setAddressText(initialLocation);
    }
  }, [initialLocation]);

  const origin = userLatitude && userLongitude ? `${userLatitude},${userLongitude}` : undefined;
  console.log("DEBUG - Tọa độ của bạn (Origin):", origin);

  return (
    <View
      className={`flex relative z-50 flex-row justify-center items-center rounded-xl border border-gray-300 bg-white h-14 ${containerStyle}`}
    >
      <GooglePlacesAutocomplete
        ref={placesRef}
        fetchDetails={true}
        placeholder={t("home.whereTo")}
        enablePoweredByContainer={false}
        debounce={300}
        minLength={2}
        styles={{
          container: {
            flex: 1,
            zIndex: 9999,
          },
          textInputContainer: {
            alignItems: "center",
            justifyContent: "center",
            marginHorizontal: 10,
            backgroundColor: "transparent",
            borderTopWidth: 0,
            borderBottomWidth: 0,
            borderLeftWidth: 0,
            borderRightWidth: 0,
            height: 44,
            paddingLeft: 4,
          },
          textInput: {
            backgroundColor: "transparent",
            fontSize: 15,
            fontFamily: "JakartaSemiBold",
            color: "#1F2937",
            height: 44,
            width: "100%",
            borderTopWidth: 0,
            borderBottomWidth: 0,
            borderLeftWidth: 0,
            borderRightWidth: 0,
            paddingTop: 0,
            paddingBottom: 0,
            marginTop: 0,
          },
          listView: {
            backgroundColor: textInputBackgroundColor || "white",
            position: "absolute",
            top: 50, // Đẩy xuống một chút để không đè lên input
            left: 0,
            right: 0,
            width: "100%",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 10,
            borderRadius: 12,
            zIndex: 99999,
            overflow: "visible", // Quan trọng để shadow và list hiện ra
          },
          row: {
            backgroundColor: "white",
            padding: 0,
            height: "auto",
            minHeight: 64,
          },
          separator: {
            height: 1,
            backgroundColor: "#F3F4F6",
            marginHorizontal: 16,
          },
          description: {
            color: "#111827",
            fontSize: 14,
          },
        }}
        onPress={(data, details = null) => {
          setIsLoading(true);
          try {
            handlePress({
              latitude: details?.geometry.location.lat!,
              longitude: details?.geometry.location.lng!,
              address: data.description,
            });
          } finally {
            setIsLoading(false);
          }
        }}
        query={{
          key: googlePlacesApiKey,
          language: "vi",
          components: "country:vn",
          location: origin,
          radius: 10000,
          origin: origin,
        } as any}
        GooglePlacesDetailsQuery={{
          fields: "geometry,formatted_address",
        }}
        nearbyPlacesAPI="GooglePlacesSearch"
        renderLeftButton={() => (
          <View className="justify-center items-center w-6 h-6">
            {isLoading ? (
              <ActivityIndicator size="small" color="#10B981" />
            ) : (
              <Image
                source={icon ? icon : icons.search}
                className="w-6 h-6"
                resizeMode="contain"
              />
            )}
          </View>
        )}
        {...({ renderRow: undefined } as any)}
        renderRow={(data: any) => {
          console.log("SUGGESTION ITEM:", data.description, " - DISTANCE:", data.distance_meters);

          return (
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 12, width: '100%', borderRadius: 12 }}>
              <View style={{ alignItems: "center", marginRight: 8, width: 50 }}>
                <View className="w-12 h-12 items-center justify-center bg-green-50 rounded-full border border-green-200">
                  <Ionicons name="location-outline" size={20} color="#10B981" />
                </View>
                {data.distance_meters !== undefined && data.distance_meters !== null && (
                  <Text className="font-JakartaBold text-xs mt-1 text-green-600">
                    {data.distance_meters < 5 ? "Gần bạn" : (data.distance_meters < 1000 ? `${data.distance_meters} m` : `${(data.distance_meters / 1000).toFixed(1)} km`)}
                  </Text>
                )}
              </View>
              <View style={{ flex: 1, flexShrink: 1, justifyContent: 'center' }}>
                <Text
                  className="text-base text-gray-500 font-JakartaBold"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {data.structured_formatting?.main_text || data.description}
                </Text>
                <Text
                  className="text-sm text-gray-500 font-JakartaMedium"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {data.structured_formatting?.secondary_text || ""}
                </Text>
              </View>
            </View>
          );
        }}
        textInputProps={{
          placeholderTextColor: "gray",
          placeholder: t("home.whereTo"),
          numberOfLines: 1,
          editable: !isLoading,
          scrollEnabled: false,
          ref: textInputRef,
        }}
      />
    </View>
  );
};

export default GoogleTextInput;

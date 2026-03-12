import { icons } from "@/constants";
import { useFetch } from "@/lib/fetch";
import {
  calculateDriverTimes,
  calculateRegion,
  generateMarkersFromData,
} from "@/lib/map";
import { useDriverStore, useLocationStore } from "@/store";
import { Driver, MarkerData } from "@/types/type";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import { useAuth } from "@/context/AuthContext";

interface MapProps {
  originLatitude?: number;
  originLongitude?: number;
  destinationLatitude?: number;
  destinationLongitude?: number;
}

const Map = ({
  originLatitude: propOriginLatitude,
  originLongitude: propOriginLongitude,
  destinationLatitude: propDestinationLatitude,
  destinationLongitude: propDestinationLongitude,
}: MapProps) => {
  const { user } = useAuth();
  const {
    data: drivers,
    loading,
    error,
  } = useFetch<Driver[]>(
    `/(api)/driver${user?.id ? `?user_id=${user.id}` : ""}`
  );

  useEffect(() => {
    if (error) console.error("Map - Drivers fetch error:", error);
  }, [drivers, error]);
  const {
    userLongitude: storeUserLongitude,
    userLatitude: storeUserLatitude,
    destinationLatitude: storeDestinationLatitude,
    destinationLongitude: storeDestinationLongitude,
  } = useLocationStore();

  const userLatitude = propOriginLatitude
    ? Number(propOriginLatitude)
    : storeUserLatitude;
  const userLongitude = propOriginLongitude
    ? Number(propOriginLongitude)
    : storeUserLongitude;
  const destinationLatitude = propDestinationLatitude
    ? Number(propDestinationLatitude)
    : storeDestinationLatitude;
  const destinationLongitude = propDestinationLongitude
    ? Number(propDestinationLongitude)
    : storeDestinationLongitude;
  const { selectedDriver, setDrivers } = useDriverStore();
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [showMapAnyway, setShowMapAnyway] = useState(false);
  const region = calculateRegion({
    userLongitude,
    userLatitude,
    destinationLatitude,
    destinationLongitude,
  });

  useEffect(() => {
    if (Array.isArray(drivers)) {
      if (!userLatitude || !userLongitude) return;

      const newMarkers = generateMarkersFromData({
        data: drivers,
        userLatitude,
        userLongitude,
      });

      setMarkers(newMarkers);
    }
  }, [drivers, userLatitude, userLongitude]);

  useEffect(() => {
    if (
      markers.length > 0 &&
      destinationLatitude !== undefined &&
      destinationLongitude !== undefined
    ) {
      calculateDriverTimes({
        markers,
        userLatitude,
        userLongitude,
        destinationLatitude,
        destinationLongitude,
      }).then((drivers) => {
        setDrivers(drivers as MarkerData[]);
      });
    }
  }, [markers, destinationLatitude, destinationLongitude]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        setShowMapAnyway(true);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [loading]);

  if (!userLatitude || !userLongitude) {
    return (
      <View className="flex justify-between items-center w-full">
        <ActivityIndicator size="small" color="#000" />
        <Text className="mt-2 text-sm text-gray-600">Đang tải vị trí...</Text>
      </View>
    );
  }

  if (loading && !showMapAnyway) {
    return (
      <View className="flex justify-between items-center w-full">
        <ActivityIndicator size="small" color="#000" />
        <Text className="mt-2 text-sm text-gray-600">Đang tải tài xế...</Text>
      </View>
    );
  }
  return (
    <MapView
      provider={PROVIDER_DEFAULT}
      style={{ height: "100%", width: "100%" }}
      tintColor="black"
      mapType="standard"
      region={region}
      showsPointsOfInterest={false}
      showsUserLocation={true}
      userInterfaceStyle="light"
    >
      {markers.map((marker) => (
        <Marker
          key={marker.id}
          coordinate={{
            latitude: Number(marker.latitude),
            longitude: Number(marker.longitude),
          }}
          title={marker.title}
          image={(() => {
            const isSelected = selectedDriver === marker.id;
            const isCar = ["Car", "car", "suv"].includes(marker.vehicle_type);

            if (isSelected) {
              return isCar ? icons.selectedMarker2 : icons.selectedMarker;
            } else {
              return isCar ? icons.marker2 : icons.marker;
            }
          })()}
        />
      ))}

      {destinationLatitude &&
        destinationLongitude &&
        userLatitude &&
        userLongitude && (
          <>
            <Marker
              key="destination"
              coordinate={{
                latitude: Number(destinationLatitude),
                longitude: Number(destinationLongitude),
              }}
              title="Địa điểm"
              image={icons.pin}
            />
            <MapViewDirections
              origin={{
                latitude: Number(userLatitude),
                longitude: Number(userLongitude),
              }}
              destination={{
                latitude: Number(destinationLatitude),
                longitude: Number(destinationLongitude),
              }}
              apikey={process.env.EXPO_PUBLIC_GOOGLE_API_KEY!}
              strokeColor="#2F855A"
              strokeWidth={4}
              precision="high"
              onError={(errorMessage) => {
                console.warn("MapViewDirections Error:", errorMessage);
              }}
            />
          </>
        )}
    </MapView>
  );
};

export default Map;

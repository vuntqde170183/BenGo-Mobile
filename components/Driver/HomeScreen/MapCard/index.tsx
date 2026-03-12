import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';

export interface MarkerLocation {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  description?: string;
}

interface MapCardProps {
  fixedMarkers?: MarkerLocation[];
  onMarkerPress?: (marker: MarkerLocation) => void;
  showUserLocation?: boolean;
}

const MapCard: React.FC<MapCardProps> = ({
  fixedMarkers = [],
  onMarkerPress,
  showUserLocation = true,
}) => {
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLoading(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const currentRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
      setRegion(currentRegion);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <View className="h-[250px] w-full items-center justify-center bg-gray-50 mb-4 rounded-3xl overflow-hidden px-4">
        <ActivityIndicator size="small" color="#22C55E" />
        <Text className="text-gray-400 mt-2 text-xs font-Jakarta">Đang tải bản đồ...</Text>
      </View>
    );
  }

  return (
    <View className="h-[280px] w-full mb-4 rounded-3xl overflow-hidden bg-gray-100 shadow-sm self-center px-5">
      <MapView
        ref={mapRef}
        className="w-full h-full rounded-3xl"
        provider={PROVIDER_DEFAULT}
        initialRegion={region}
        showsUserLocation={showUserLocation}
        showsMyLocationButton={false}
      >
        {fixedMarkers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={{
              latitude: marker.latitude,
              longitude: marker.longitude,
            }}
            title={marker.title}
            description={marker.description}
            onPress={() => onMarkerPress && onMarkerPress(marker)}
          >
            <View className="items-center justify-center">
              <View className="bg-white p-1 rounded-full shadow-md border border-gray-100">
                 <Text className="text-lg">🚛</Text>
              </View>
            </View>
          </Marker>
        ))}
      </MapView>
    </View>
  );
};

export default MapCard;

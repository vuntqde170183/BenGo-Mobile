import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { FontAwesome5 } from '@expo/vector-icons';

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

const MapCard: React.FC<MapCardProps & { orders?: any[], onOrderPress?: (order: any) => void }> = ({
  fixedMarkers = [],
  orders = [],
  onOrderPress,
  showUserLocation = true,
}) => {
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setRegion({
            latitude: 16.047079,
            longitude: 108.206230,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          });
          setLoading(false);
          return;
        }

        let location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const currentRegion = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        };
        setRegion(currentRegion);
      } catch (error) {
        setRegion({
          latitude: 16.047079,
          longitude: 108.206230,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const formatCurrency = (amount?: number): string => {
    if (amount == null || isNaN(amount)) return '0 ₫';
    return amount.toLocaleString('vi-VN') + ' ₫';
  };

  if (loading) {
    return (
      <View className="h-[300px] w-full items-center justify-center bg-gray-50 mb-4 rounded-3xl overflow-hidden px-4">
        <ActivityIndicator size="small" color="#22C55E" />
        <Text className="text-gray-400 mt-2 text-base font-Jakarta">Đang tải bản đồ...</Text>
      </View>
    );
  }

  return (
    <View
      className="h-[400px] w-full mb-4 rounded-3xl overflow-hidden bg-gray-50 border border-gray-100"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      }}
    >
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={region}
        showsUserLocation={false}
        showsMyLocationButton={false}
      >
        {/* Driver/User Marker */}
        {region && (
          <Marker
            coordinate={{
              latitude: region.latitude,
              longitude: region.longitude,
            }}
          >
            <View
              className="bg-white p-2.5 rounded-full border border-gray-100 items-center justify-center"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 4,
                elevation: 4,
              }}
            >
              <FontAwesome5 name="car-side" size={18} color="#10B981" />
            </View>
          </Marker>
        )}

        {/* Pending Orders Markers */}
        {orders.map((order) => (
          <Marker
            key={order.orderId}
            coordinate={{
              latitude: order.pickup?.lat || 0,
              longitude: order.pickup?.lng || 0,
            }}
            onPress={() => onOrderPress && onOrderPress(order)}
          >
            <View className="items-center">
              <View
                className="bg-white px-2 py-1 rounded-full border border-gray-100 mb-1"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: 2,
                }}
              >
                <Text className="text-sm font-JakartaBold text-gray-900">{formatCurrency(order.price)}</Text>
              </View>
              <View
                className="w-3 h-3 bg-green-500 rounded-full border-2 border-white"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: 2,
                }}
              />
            </View>
          </Marker>
        ))}
      </MapView>
    </View>
  );
};

export default MapCard;

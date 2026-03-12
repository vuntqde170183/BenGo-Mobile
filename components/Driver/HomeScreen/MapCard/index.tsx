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
        console.log('[MapCard] Requesting permissions...');
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.warn('[MapCard] Permission denied');
          // Fallback to a default location (e.g., Hanoi) if denied
          setRegion({
            latitude: 21.0285,
            longitude: 105.8542,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          });
          setLoading(false);
          return;
        }

        console.log('[MapCard] Getting position...');
        let location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        console.log('[MapCard] Position obtained:', location.coords.latitude, location.coords.longitude);
        
        const currentRegion = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        };
        setRegion(currentRegion);
      } catch (error) {
        console.error('[MapCard] Error getting location:', error);
        // Fallback to a default location on error
        setRegion({
          latitude: 21.0285,
          longitude: 105.8542,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        });
      } finally {
        setLoading(false);
        console.log('[MapCard] Loading finished');
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
        <Text className="text-gray-400 mt-2 text-xs font-Jakarta">Đang tải bản đồ...</Text>
      </View>
    );
  }

  return (
    <View className="h-[400px] w-full mb-4 rounded-3xl overflow-hidden bg-gray-50 shadow-sm border border-gray-100">
      <MapView
        ref={mapRef}
        className="w-full h-full"
        provider="google"
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
             <View className="bg-white p-2 rounded-full shadow-md border border-gray-100">
                <Text className="text-xl">🚗</Text>
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
               <View className="bg-white px-2 py-1 rounded-full shadow-sm border border-gray-100 mb-1">
                  <Text className="text-[10px] font-JakartaBold text-gray-900">{formatCurrency(order.price)}</Text>
               </View>
               <View className="w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm" />
            </View>
          </Marker>
        ))}
      </MapView>
    </View>
  );
};

export default MapCard;

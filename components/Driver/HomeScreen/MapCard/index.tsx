import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { HotspotLocation } from '@/api/hotspot';

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

const CROWD_COLORS = {
  high: '#EF4444',
  medium: '#F59E0B',
  low: '#10B981',
};

const MapCard: React.FC<MapCardProps & {
  orders?: any[],
  onOrderPress?: (order: any) => void,
  hotspots?: HotspotLocation[],
  onHotspotPress?: (hotspot: HotspotLocation) => void,
}> = ({
  fixedMarkers = [],
  orders = [],
  onOrderPress,
  hotspots = [],
  onHotspotPress,
  showUserLocation = true,
}) => {
    const mapRef = useRef<MapView>(null);
    const fullscreenMapRef = useRef<MapView>(null);
    const [region, setRegion] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
      (async () => {
        try {
          let { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            setRegion({
              latitude: 16.047079,
              longitude: 108.206230,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
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
            latitudeDelta: 0.004,
            longitudeDelta: 0.004,
          };
          setRegion(currentRegion);

          setTimeout(() => {
            mapRef.current?.animateToRegion(currentRegion, 1000);
          }, 500);
        } catch (error) {
          setRegion({
            latitude: 16.047079,
            longitude: 108.206230,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
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

    const handleZoomIn = () => {
      mapRef.current?.getCamera().then((camera) => {
        const currentZoom = camera.zoom || 15;
        mapRef.current?.animateCamera({ zoom: currentZoom + 1 }, { duration: 300 });
      });
    };

    const handleZoomOut = () => {
      mapRef.current?.getCamera().then((camera) => {
        const currentZoom = camera.zoom || 15;
        mapRef.current?.animateCamera({ zoom: currentZoom - 1 }, { duration: 300 });
      });
    };

    if (loading) {
      return (
        <View className="flex-1 w-full items-center justify-center bg-gray-50 rounded-t-3xl overflow-hidden px-4">
          <ActivityIndicator size="small" color="#22C55E" />
          <Text className="text-gray-500 mt-2 text-base font-Jakarta">Đang tải bản đồ...</Text>
        </View>
      );
    }

    const renderMarkers = () => (
      <>
        {region && (
          <Marker
            coordinate={{
              latitude: region.latitude,
              longitude: region.longitude,
            }}
          >
            <View className="bg-gray-100 p-1 rounded-full border-2 border-green-500">
              <Ionicons name="car-outline" size={20} color="#10B981" />
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
                <Text className="text-sm font-JakartaBold text-gray-700">{formatCurrency(order.price)}</Text>
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

        {/* Hotspot Markers */}
        {Array.from(new Map(hotspots.map((h) => [h.id, h])).values()).map((hotspot, index) => {
          const crowdColor = CROWD_COLORS[hotspot.crowdLevel] || CROWD_COLORS.medium;
          return (
            <Marker
              key={`hotspot-${hotspot.id}-${index}`}
              coordinate={{
                latitude: hotspot.latitude,
                longitude: hotspot.longitude,
              }}
              onPress={() => onHotspotPress && onHotspotPress(hotspot)}
            >
              <View className="items-center">
                <View
                  className="px-2 py-1 rounded-lg mb-1"
                  style={{
                    backgroundColor: crowdColor + '20',
                    borderWidth: 1,
                    borderColor: crowdColor,
                    shadowColor: crowdColor,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 4,
                  }}
                >
                  <Text style={{ color: crowdColor, fontSize: 10, fontWeight: 'bold' }} numberOfLines={1}>
                    {hotspot.name}
                  </Text>
                </View>
                <View
                  className="w-8 h-8 rounded-full items-center justify-center"
                  style={{
                    backgroundColor: crowdColor,
                    shadowColor: crowdColor,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.4,
                    shadowRadius: 4,
                    elevation: 5,
                  }}
                >
                  <Ionicons name="flame" size={16} color="white" />
                </View>
              </View>
            </Marker>
          );
        })}
      </>
    );

    return (
      <>
        {/* ── Compact Map Card ───────────────────────────────────────────── */}
        <View
          className="flex-1 w-full rounded-t-3xl overflow-hidden bg-gray-50 border border-gray-100"
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
            toolbarEnabled={false}
          >
            {renderMarkers()}
          </MapView>

          {/* Zoom Controls */}
          <View className="absolute right-4 top-4 flex-col gap-3">
            <TouchableOpacity
              onPress={handleZoomIn}
              className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-lg border border-gray-100"
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={24} color="#374151" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleZoomOut}
              className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-lg border border-gray-100"
              activeOpacity={0.7}
            >
              <Ionicons name="remove" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          {/* Fullscreen Button */}
          <TouchableOpacity
            onPress={() => setIsFullscreen(true)}
            className="absolute left-4 top-4 w-10 h-10 bg-white rounded-full items-center justify-center shadow-lg border border-gray-100"
            activeOpacity={0.7}
          >
            <Ionicons name="expand-outline" size={20} color="#374151" />
          </TouchableOpacity>
        </View>

        {/* ── Fullscreen Modal ────────────────────────────────────────────── */}
        <Modal
          visible={isFullscreen}
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => setIsFullscreen(false)}
        >
          <View style={StyleSheet.absoluteFillObject}>
            <MapView
              ref={fullscreenMapRef}
              style={StyleSheet.absoluteFillObject}
              initialRegion={region}
              showsUserLocation={false}
              showsMyLocationButton={false}
              toolbarEnabled={false}
            >
              {renderMarkers()}
            </MapView>

            {/* Fullscreen Zoom Controls */}
            <View style={{ position: 'absolute', right: 16, top: 60, gap: 12 }}>
              <TouchableOpacity
                onPress={() => {
                  fullscreenMapRef.current?.getCamera().then((cam) => {
                    fullscreenMapRef.current?.animateCamera({ zoom: (cam.zoom || 15) + 1 }, { duration: 300 });
                  });
                }}
                style={styles.controlBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={24} color="#374151" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  fullscreenMapRef.current?.getCamera().then((cam) => {
                    fullscreenMapRef.current?.animateCamera({ zoom: (cam.zoom || 15) - 1 }, { duration: 300 });
                  });
                }}
                style={styles.controlBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="remove" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            {/* Close Fullscreen Button */}
            <TouchableOpacity
              onPress={() => setIsFullscreen(false)}
              style={[styles.controlBtn, { position: 'absolute', left: 16, top: 60 }]}
              activeOpacity={0.7}
            >
              <Ionicons name="contract-outline" size={20} color="#374151" />
            </TouchableOpacity>
          </View>
        </Modal>
      </>
    );
  };

const styles = StyleSheet.create({
  controlBtn: {
    width: 40,
    height: 40,
    backgroundColor: 'white',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
});

export default MapCard;
import { View, Text, Alert, Modal, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useCallback, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import {
  Header,
  MapCard,
  SummaryCard,
  type MarkerLocation,
} from '@/components/Driver/HomeScreen';
import { useAuth } from '@/context/AuthContext';
import { useDriverPendingOrders, useDriverStats, useDriverToggleStatus, useDriverAcceptOrder, useDriverUpdateLocation } from '@/hooks/useDriver';
import { PendingOrder } from '@/api/driver';

interface LocationState {
  address: string;
  city: string;
  coordinates: string;
  latitude: number;
  longitude: number;
  heading: number | null;
}

const DriverHome = () => {
  const [isOnline, setIsOnline] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);

  const [currentLocation, setCurrentLocation] = useState<LocationState>({
    address: 'Đang tải vị trí...',
    city: 'Đà Nẵng',
    coordinates: '',
    latitude: 16.047079,
    longitude: 108.206230,
    heading: null,
  });

  const { user } = useAuth();
  const mapRef = useRef<any>(null);

  const today = new Date().toISOString().split('T')[0];

  // Queries
  const { data: pendingOrders = [], refetch: refetchOrders, isLoading: isLoadingOrders } = useDriverPendingOrders(
    currentLocation.latitude,
    currentLocation.longitude,
    5
  );

  const { data: driverStats = { totalEarnings: 0, totalTrips: 0, rating: 5 }, isLoading: isLoadingStats } = useDriverStats(
    today,
    today
  );

  // Mutations
  const { mutateAsync: toggleStatus, isPending: isTogglingStatus } = useDriverToggleStatus();
  const { mutateAsync: acceptOrder, isPending: isAccepting } = useDriverAcceptOrder();
  const { mutate: updateLocation } = useDriverUpdateLocation();



  // Toggle online/offline status via API
  const toggleOnlineStatus = async () => {
    if (currentLocation.latitude === 0 && currentLocation.longitude === 0) {
      Alert.alert('Lỗi', 'Vui lòng chờ xác định vị trí trước khi bật trạng thái');
      return;
    }

    const newStatus = !isOnline;

    try {
      await toggleStatus({
        isOnline: newStatus,
        location: {
          lat: currentLocation.latitude,
          lng: currentLocation.longitude,
        },
      });
      setIsOnline(newStatus);
    } catch (error: any) {
      console.error('Toggle status error:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái hoạt động');
    }
  };

  // Accept order
  const handleAcceptOrder = async (orderId: string) => {
    try {
      await acceptOrder(orderId);
      Alert.alert('Thành công', 'Bạn đã nhận chuyến thành công!');
      setShowOrderModal(false);
      setSelectedOrder(null);
    } catch (error: any) {
      console.error('Accept order error:', error);
      Alert.alert('Lỗi', 'Không thể nhận chuyến vào lúc này');
    }
  };





  const reverseGeocode = async (latitude: number, longitude: number): Promise<{ address: string; city: string }> => {
    try {
      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}&language=vi`
      );
      const data = await response.json();

      if (data && data.results && data.results.length > 0) {
        const result = data.results[0];
        const addrComponents = result.address_components;

        let streetNumber = '';
        let route = '';
        let district = '';
        let city = '';

        for (const component of addrComponents) {
          if (component.types.includes('street_number')) streetNumber = component.long_name;
          if (component.types.includes('route')) route = component.long_name;
          if (component.types.includes('administrative_area_level_2')) district = component.long_name;
          if (component.types.includes('administrative_area_level_1')) city = component.long_name;
        }

        const streetAddress = [streetNumber, route].filter(Boolean).join(' ');

        return {
          address: streetAddress || result.formatted_address.split(',')[0],
          city: district || city || 'Việt Nam',
        };
      }
      return { address: 'Không xác định', city: 'Việt Nam' };
    } catch (error) {
      console.error('Reverse Geocode error:', error);
      return { address: 'Lỗi tải địa chỉ', city: 'Việt Nam' };
    }
  };

  const getCurrentLocation = useCallback(async () => {
    setIsLoadingLocation(true);

    try {
      // 1. Kiểm tra xem dịch vụ định vị có được bật không
      const isServicesEnabled = await Location.hasServicesEnabledAsync();
      if (!isServicesEnabled) {
        throw new Error('Location services disabled');
      }

      // 2. Xin quyền truy cập
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setCurrentLocation({
          address: 'Hải Châu, Đà Nẵng',
          city: 'Đà Nẵng',
          coordinates: '16.0471° N, 108.2062° E',
          latitude: 16.047079,
          longitude: 108.206230,
          heading: null,
        });
        setIsLoadingLocation(false);
        return;
      }

      let location = await Location.getLastKnownPositionAsync({});

      if (!location) {
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      }

      const { latitude, longitude } = location.coords;
      const { address, city } = await reverseGeocode(latitude, longitude);

      setCurrentLocation({
        address,
        city,
        coordinates: `${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E`,
        latitude,
        longitude,
        heading: location.coords.heading,
      });

      if (isOnline) {
        updateLocation({ lat: latitude, lng: longitude, heading: location.coords.heading ?? undefined });
      }
    } catch (error: any) {
      setCurrentLocation(prev => ({
        ...prev,
        address: 'Hải Châu, Đà Nẵng (Fallback)',
        city: 'Đà Nẵng',
        latitude: 16.047079,
        longitude: 108.206230,
      }));
    } finally {
      setIsLoadingLocation(false);
    }
  }, [isOnline, updateLocation]);

  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);



  useEffect(() => {
    if (isOnline && currentLocation.latitude !== 0) {
      const interval = setInterval(() => {
        updateLocation({
          lat: currentLocation.latitude,
          lng: currentLocation.longitude,
          heading: currentLocation.heading || undefined
        } as any);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [isOnline, currentLocation.latitude, currentLocation.longitude, updateLocation]);

  const formatCurrency = (amount?: number): string => {
    if (amount == null || isNaN(amount)) return '0 ₫';
    return amount.toLocaleString('vi-VN') + ' ₫';
  };

  const handleOrderPress = (order: PendingOrder) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <Header
        isOnline={isOnline}
        onToggleStatus={toggleOnlineStatus}
        userName={user?.name}
        disabled={isTogglingStatus}
      />

      <View className="flex-1">
        <SummaryCard
          totalEarnings={driverStats.totalEarnings}
          totalTrips={driverStats.totalTrips}
        />

        <View className="px-4 mb-2">
          {isOnline ? (
            <Text className="text-green-600 text-base font-JakartaMedium italic">
              Đang tìm đơn hàng mới xung quanh bạn...
            </Text>
          ) : (
            <Text className="text-red-500 text-base font-JakartaBold">
              Bạn đang tắt chế độ nhận đơn
            </Text>
          )}
        </View>

        <View className="flex-1 relative">
          <MapCard
            orders={pendingOrders}
            onOrderPress={handleOrderPress}
          />

          {/* Recenter FAB */}
          <TouchableOpacity
            className="absolute right-5 bottom-5 w-12 h-12 bg-white rounded-full items-center justify-center border border-gray-100"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 4,
            }}
            onPress={getCurrentLocation}
          >
            <Ionicons name="location-sharp" size={24} color="#10B981" />
          </TouchableOpacity>
        </View>

        {/* Bottom List of Orders */}
        <View className="h-1/3 bg-white border-t border-gray-50">
          <View className="px-4 py-3 border-b border-gray-50 flex-row justify-between items-center">
            <Text className="text-gray-900 font-JakartaBold text-lg">Đơn hàng khả dụng ({pendingOrders.length})</Text>
            <TouchableOpacity onPress={() => refetchOrders()}>
              <Ionicons name="refresh" size={24} color="#10B981" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={pendingOrders}
            keyExtractor={(item) => item.orderId}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleOrderPress(item)}
                className="flex-row items-center justify-between px-4 py-4 border-b border-gray-50 active:bg-gray-50"
              >
                <View className="flex-1 mr-4">
                  <View className="flex-row items-center mb-1">
                    <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                    <Text className="text-gray-900 font-JakartaBold text-base flex-1" numberOfLines={1}>
                      {item.pickup?.address || 'Điểm đón hiện tại'}
                    </Text>
                  </View>
                  <Text className="text-gray-500 text-base font-Jakarta ml-4">Cách bạn {item.distance} km</Text>
                </View>
                <Text className="text-green-600 font-JakartaBold text-base">{formatCurrency(item.price)}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={() => (
              <View className="flex-1 items-center justify-center pt-10">
                <Text className="text-gray-500 font-Jakarta text-base">
                  {isOnline ? 'Chưa tìm thấy đơn hàng nào gần đây' : 'Bật trực tuyến để xem đơn hàng'}
                </Text>
              </View>
            )}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>

      <Modal
        visible={showOrderModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOrderModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View
            className="bg-white rounded-t-[40px] p-6 pb-10"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -10 },
              shadowOpacity: 0.1,
              shadowRadius: 20,
              elevation: 20,
            }}
          >
            {selectedOrder && (
              <>
                <View className="w-12 h-1.5 bg-gray-100 rounded-full self-center mb-4" />
                <Text className="text-gray-900 text-xl font-JakartaBold text-center mb-4">Chi tiết đơn hàng</Text>

                <View className="space-y-4">
                  <View className="flex-row justify-between items-center py-3 border-b border-gray-50">
                    <Text className="text-gray-500 font-Jakarta text-base">Mã đơn hàng</Text>
                    <Text className="text-gray-900 font-JakartaBold text-base">#{selectedOrder.orderId.slice(-8)}</Text>
                  </View>
                  <View className="flex-row justify-between items-center py-3 border-b border-gray-50">
                    <Text className="text-gray-500 font-Jakarta text-base">Khoảng cách</Text>
                    <Text className="text-gray-900 font-JakartaBold text-base">{selectedOrder.distance} km</Text>
                  </View>
                  <View className="py-4">
                    <Text className="text-gray-500 font-Jakarta text-sm uppercase mb-1">Giá cước thanh toán</Text>
                    <Text className="text-green-600 text-3xl font-JakartaBold">{formatCurrency(selectedOrder.price)}</Text>
                  </View>
                </View>

                <View className="flex-row mt-8 gap-4">
                  <TouchableOpacity
                    className="flex-1 h-14 bg-gray-50 rounded-2xl items-center justify-center border border-gray-100"
                    onPress={() => {
                      setShowOrderModal(false);
                      setSelectedOrder(null);
                    }}
                  >
                    <Text className="text-gray-500 font-JakartaBold">BỎ QUA</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className={`flex-[2] h-14 bg-green-500 rounded-2xl items-center justify-center ${isAccepting ? 'opacity-70' : ''}`}
                    style={{
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.1,
                      shadowRadius: 2,
                      elevation: 2,
                    }}
                    onPress={() => handleAcceptOrder(selectedOrder.orderId)}
                    disabled={isAccepting}
                  >
                    {isAccepting ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text className="text-white font-JakartaBold text-lg">NHẬN CHUYẾN</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default DriverHome;

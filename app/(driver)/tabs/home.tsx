import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Alert, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import {
  Header,
  LocationCard,
  ToggleCard,
  ActionCard,
  StatsCard,
  MapCard,
  type MarkerLocation,
} from '@/components/Driver/HomeScreen';
import { useAuth } from '@/context/AuthContext';
import { driverService, DriverStats, PendingOrder } from '@/lib/driver';

interface LocationState {
  address: string;
  city: string;
  coordinates: string;
  latitude: number;
  longitude: number;
}

const DriverHome = () => {
  const [isOnline, setIsOnline] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PendingOrder | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [driverStats, setDriverStats] = useState<DriverStats>({
    totalEarnings: 0,
    totalTrips: 0,
    rating: 5,
  });
  const [currentLocation, setCurrentLocation] = useState<LocationState>({
    address: 'Đang tải vị trí...',
    city: '',
    coordinates: '',
    latitude: 0,
    longitude: 0,
  });
  const { user } = useAuth();

  // Fetch pending orders nearby
  const fetchPendingOrders = useCallback(async () => {
    if (currentLocation.latitude === 0) return;

    setIsLoadingOrders(true);
    try {
      const orders = await driverService.getPendingOrders(
        currentLocation.latitude,
        currentLocation.longitude,
        5,
      );
      setPendingOrders(orders || []);
    } catch (error) {
      console.error('Fetch pending orders error:', error);
    } finally {
      setIsLoadingOrders(false);
    }
  }, [currentLocation.latitude, currentLocation.longitude]);

  // Toggle online/offline status via API
  const toggleOnlineStatus = async () => {
    if (currentLocation.latitude === 0 && currentLocation.longitude === 0) {
      Alert.alert('Lỗi', 'Vui lòng chờ xác định vị trí trước khi bật trạng thái');
      return;
    }

    setIsTogglingStatus(true);
    const newStatus = !isOnline;

    try {
      await driverService.toggleStatus({
        isOnline: newStatus,
        location: {
          lat: currentLocation.latitude,
          lng: currentLocation.longitude,
        },
      });
      setIsOnline(newStatus);

      if (newStatus) {
        fetchPendingOrders();
      } else {
        setPendingOrders([]);
      }
    } catch (error: any) {
      console.error('Toggle status error:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái hoạt động');
    } finally {
      setIsTogglingStatus(false);
    }
  };

  // Accept order
  const handleAcceptOrder = async (orderId: string) => {
    setIsAccepting(true);
    try {
      const result = await driverService.acceptOrder(orderId);
      if (result) {
        Alert.alert('Thành công', 'Bạn đã nhận chuyến thành công!');
        setShowOrderModal(false);
        setSelectedOrder(null);
        fetchPendingOrders();
      }
    } catch (error: any) {
      console.error('Accept order error:', error);
      Alert.alert('Lỗi', 'Không thể nhận chuyến vào lúc này');
    } finally {
      setIsAccepting(false);
    }
  };

  // Fetch driver stats
  const fetchDriverStats = useCallback(async () => {
    setIsLoadingStats(true);
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

      const stats = await driverService.getStats(
        startOfDay.toISOString(),
        endOfDay.toISOString(),
      );
      setDriverStats(stats);
    } catch (error) {
      console.error('Fetch stats error:', error);
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  // Update location to backend periodically
  const updateLocationToServer = useCallback(async (lat: number, lng: number) => {
    try {
      await driverService.updateLocation({ lat, lng });
    } catch (error) {
      console.warn('Update location error:', error);
    }
  }, []);

  // Get address from coordinates using Nominatim (as requested by user)
  const reverseGeocode = async (latitude: number, longitude: number): Promise<{ address: string; city: string }> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'BenGoDriver/1.0',
          },
        },
      );
      const data = await response.json();

      if (data && data.address) {
        const addr = data.address;
        const streetAddress = [
          addr.house_number,
          addr.road || addr.street,
          addr.suburb || addr.neighbourhood,
        ].filter(Boolean).join(', ');

        const cityName = [
          addr.city || addr.town || addr.village,
          addr.state,
        ].filter(Boolean).join(', ');

        return {
          address: streetAddress || data.display_name?.split(',').slice(0, 2).join(',') || 'Không xác định',
          city: cityName || 'Việt Nam',
        };
      }
      return { address: 'Không xác định', city: 'Việt Nam' };
    } catch (error) {
      return { address: 'Lỗi tải địa chỉ', city: 'Việt Nam' };
    }
  };

  // Get current location
  const getCurrentLocation = useCallback(async () => {
    setIsLoadingLocation(true);

    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setCurrentLocation({
        address: 'Không có quyền truy cập vị trí',
        city: 'Vui lòng cấp quyền trong cài đặt',
        coordinates: '',
        latitude: 0,
        longitude: 0,
      });
      setIsLoadingLocation(false);
      return;
    }

    try {
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      const { address, city } = await reverseGeocode(latitude, longitude);

      setCurrentLocation({
        address,
        city,
        coordinates: `${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E`,
        latitude,
        longitude,
      });

      if (isOnline) {
        updateLocationToServer(latitude, longitude);
      }
    } catch (error) {
      console.error('Location error:', error);
    } finally {
      setIsLoadingLocation(false);
    }
  }, [isOnline, updateLocationToServer]);

  useEffect(() => {
    getCurrentLocation();
    fetchDriverStats();
  }, [getCurrentLocation, fetchDriverStats]);

  // Auto-refresh pending orders khi online
  useEffect(() => {
    if (isOnline && currentLocation.latitude !== 0) {
      fetchPendingOrders();
      const interval = setInterval(fetchPendingOrders, 30000);
      return () => clearInterval(interval);
    }
  }, [isOnline, fetchPendingOrders, currentLocation.latitude]);

  // Cập nhật vị trí lên server mỗi 10s khi online
  useEffect(() => {
    if (isOnline && currentLocation.latitude !== 0) {
      const interval = setInterval(() => {
        updateLocationToServer(currentLocation.latitude, currentLocation.longitude);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [isOnline, currentLocation.latitude, currentLocation.longitude, updateLocationToServer]);

  const formatCurrency = (amount?: number): string => {
    if (amount == null || isNaN(amount)) return '0 ₫';
    return amount.toLocaleString('vi-VN') + ' ₫';
  };

  const todayStats = [
    { value: String(driverStats.totalTrips), label: 'HOÀN THÀNH' },
    { value: formatCurrency(driverStats.totalEarnings), label: 'THU NHẬP' },
    { value: `${driverStats.rating.toFixed(1)} ⭐`, label: 'ĐÁNH GIÁ' },
  ];

  const orderMarkers: MarkerLocation[] = pendingOrders.map((order, index) => ({
    id: order.orderId,
    latitude: order.pickup?.lat || currentLocation.latitude + (index * 0.001),
    longitude: order.pickup?.lng || currentLocation.longitude + (index * 0.001),
    title: `Đơn #${order.orderId.slice(-4)}`,
    description: `${formatCurrency(order.price)} - ${order.distance} km`,
  }));

  const handleMarkerPress = (marker: MarkerLocation) => {
    const order = pendingOrders.find(o => o.orderId === marker.id);
    if (order) {
      setSelectedOrder(order);
      setShowOrderModal(true);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Header
        isOnline={isOnline}
        onOpenSettings={() => Alert.alert('Cài đặt', 'Tính năng đang phát triển')}
        userName={user?.name}
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="mt-4">
          <MapCard
            fixedMarkers={orderMarkers}
            onMarkerPress={handleMarkerPress}
            showUserLocation={true}
          />
        </View>

        <LocationCard
          address={currentLocation.address}
          city={currentLocation.city}
          coordinates={currentLocation.coordinates}
          onRefresh={getCurrentLocation}
          isLoading={isLoadingLocation}
        />

        <View className="px-5 mt-2">
          <Text className="text-gray-900 text-base font-JakartaBold mb-4">Bảng điều khiển</Text>
          
          <ToggleCard isOnline={isOnline} onToggle={toggleOnlineStatus} />

          {isOnline && (
            <View className="flex-row items-center bg-blue-50 p-4 rounded-2xl mt-4 border border-blue-100">
               <Text className="text-xl mr-3">📦</Text>
               <Text className="flex-1 text-blue-800 text-xs font-JakartaMedium">
                  {isLoadingOrders ? 'Đang tìm đơn hàng...' : `${pendingOrders.length} đơn hàng khả dụng gần bạn`}
               </Text>
               <TouchableOpacity onPress={fetchPendingOrders}>
                  <Text className="text-blue-500 text-lg">🔄</Text>
               </TouchableOpacity>
            </View>
          )}

          <View className="flex-row mt-4 -mx-1">
            <ActionCard
              icon="💰"
              title="Thu nhập"
              value={formatCurrency(driverStats.totalEarnings)}
              description="Hôm nay"
            />
            <ActionCard
              icon="🕒"
              title="Lịch sử"
              value={String(driverStats.totalTrips)}
              description="Chuyến hôm nay"
            />
          </View>

          <StatsCard title="Thống kê hiệu suất" stats={todayStats} />
        </View>
      </ScrollView>

      <Modal
        visible={showOrderModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOrderModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-[40px] p-6 pb-10">
            {selectedOrder && (
              <>
                <View className="w-12 h-1.5 bg-gray-200 rounded-full self-center mb-6" />
                <Text className="text-gray-900 text-xl font-JakartaBold text-center mb-6">Yêu cầu chuyến đi mới</Text>
                
                <View className="space-y-4">
                    <View className="flex-row justify-between items-center py-3 border-b border-gray-50">
                        <Text className="text-gray-500 font-Jakarta">Mã đơn hàng</Text>
                        <Text className="text-gray-900 font-JakartaBold">#{selectedOrder.orderId.slice(-8)}</Text>
                    </View>
                    <View className="flex-row justify-between items-center py-3 border-b border-gray-50">
                        <Text className="text-gray-500 font-Jakarta">Khoảng cách</Text>
                        <Text className="text-gray-900 font-JakartaBold">{selectedOrder.distance} km</Text>
                    </View>
                    <View className="flex-row justify-between items-center py-3">
                        <Text className="text-gray-500 font-Jakarta">Giá cước</Text>
                        <Text className="text-green-600 text-2xl font-JakartaBold">{formatCurrency(selectedOrder.price)}</Text>
                    </View>
                </View>

                <View className="flex-row mt-8 gap-4">
                  <TouchableOpacity
                    className="flex-1 h-14 bg-gray-100 rounded-2xl items-center justify-center"
                    onPress={() => {
                      setShowOrderModal(false);
                      setSelectedOrder(null);
                    }}
                  >
                    <Text className="text-gray-500 font-JakartaBold">Bỏ qua</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className={`flex-[2] h-14 bg-green-500 rounded-2xl items-center justify-center ${isAccepting ? 'opacity-70' : ''}`}
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

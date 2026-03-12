import { View, Text, Alert, Modal, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
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
import { driverService, DriverStats, PendingOrder } from '@/lib/driver';

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
    heading: null,
  });
  const { user } = useAuth();
  const mapRef = useRef<any>(null);

  // Fetch pending orders nearby
  const fetchPendingOrders = useCallback(async () => {
    if (currentLocation.latitude === 0) return;

    setIsLoadingOrders(true);
    try {
      console.log('[DriverHome] Fetching pending orders at:', currentLocation.latitude, currentLocation.longitude);
      const orders = await driverService.getPendingOrders(
        currentLocation.latitude,
        currentLocation.longitude,
        5,
      );
      console.log('[DriverHome] Pending orders received:', orders?.length || 0);
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
      console.log('[DriverHome] Toggling status to:', newStatus);
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
      const dateString = today.toISOString().split('T')[0];

      console.log('[DriverHome] Fetching stats for:', dateString);
      const stats = await driverService.getStats(dateString, dateString);
      console.log('[DriverHome] Stats received:', stats);
      setDriverStats(stats);
    } catch (error) {
      console.error('Fetch stats error:', error);
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  // Update location to backend periodically
  const updateLocationToServer = useCallback(async (lat: number, lng: number, heading?: number) => {
    try {
      await driverService.updateLocation({ lat, lng, heading });
    } catch (error) {
      console.warn('Update location error:', error);
    }
  }, []);

  const reverseGeocode = async (latitude: number, longitude: number): Promise<{ address: string; city: string }> => {
    try {
      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;
      console.log('[DriverHome] Reverse geocoding for:', { latitude, longitude });
      
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}&language=vi`
      );
      const data = await response.json();
      console.log('[DriverHome] Google Geocode Response:', data.status, data.results?.length, 'results');

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

    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setCurrentLocation({
        address: 'Không có quyền truy cập vị trí',
        city: 'Vui lòng cấp quyền trong cài đặt',
        coordinates: '',
        latitude: 0,
        longitude: 0,
        heading: null,
      });
      setIsLoadingLocation(false);
      return;
    }

    try {
      console.log('[DriverHome] Getting current position...');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = location.coords;
      console.log('[DriverHome] Coordinates obtained:', latitude, longitude);
      
      const { address, city } = await reverseGeocode(latitude, longitude);
      console.log('[DriverHome] Address resolved:', address, city);

      setCurrentLocation({
        address,
        city,
        coordinates: `${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E`,
        latitude,
        longitude,
        heading: location.coords.heading,
      });

      if (isOnline) {
        updateLocationToServer(latitude, longitude, location.coords.heading || undefined);
      }
    } catch (error) {
      console.error('[DriverHome] Location error:', error);
      // Fallback values so UI doesn't hang
      setCurrentLocation(prev => ({
        ...prev,
        address: 'Không thể xác định vị trí',
        city: 'Việt Nam',
        latitude: 21.0285,
        longitude: 105.8542,
      }));
    } finally {
      setIsLoadingLocation(false);
    }
  }, [isOnline, updateLocationToServer]);

  useEffect(() => {
    getCurrentLocation();
    fetchDriverStats();
  }, [getCurrentLocation, fetchDriverStats]);

  useEffect(() => {
    if (isOnline && currentLocation.latitude !== 0) {
      fetchPendingOrders();
      const interval = setInterval(fetchPendingOrders, 30000);
      return () => clearInterval(interval);
    }
  }, [isOnline, fetchPendingOrders, currentLocation.latitude]);

  useEffect(() => {
    if (isOnline && currentLocation.latitude !== 0) {
      const interval = setInterval(() => {
        updateLocationToServer(
          currentLocation.latitude,
          currentLocation.longitude,
          currentLocation.heading || undefined
        );
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [isOnline, currentLocation.latitude, currentLocation.longitude, updateLocationToServer]);

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
      />

      <View className="flex-1">
        <SummaryCard 
          totalEarnings={driverStats.totalEarnings}
          totalTrips={driverStats.totalTrips}
        />

        <View className="px-5 mb-2">
           {isOnline ? (
             <Text className="text-green-600 text-[11px] font-JakartaMedium italic">
               Đang tìm đơn hàng mới xung quanh bạn...
             </Text>
           ) : (
             <Text className="text-red-500 text-[11px] font-JakartaBold">
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
             className="absolute right-5 bottom-5 w-12 h-12 bg-white rounded-full shadow-md items-center justify-center border border-gray-100"
             onPress={getCurrentLocation}
           >
              <Text className="text-xl">📍</Text>
           </TouchableOpacity>
        </View>
        
        {/* Bottom List of Orders */}
        <View className="h-1/3 bg-white border-t border-gray-50">
           <View className="px-5 py-3 border-b border-gray-50 flex-row justify-between items-center">
              <Text className="text-gray-900 font-JakartaBold">Đơn hàng khả dụng ({pendingOrders.length})</Text>
              <TouchableOpacity onPress={fetchPendingOrders}>
                 <Text className="text-blue-500 text-xs font-JakartaBold">LÀM MỚI</Text>
              </TouchableOpacity>
           </View>
           
           <FlatList
             data={pendingOrders}
             keyExtractor={(item) => item.orderId}
             renderItem={({ item }) => (
               <TouchableOpacity 
                 onPress={() => handleOrderPress(item)}
                 className="flex-row items-center justify-between px-5 py-4 border-b border-gray-50 active:bg-gray-50"
               >
                 <View className="flex-1 mr-4">
                    <View className="flex-row items-center mb-1">
                       <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                       <Text className="text-gray-900 font-JakartaBold text-[13px] flex-1" numberOfLines={1}>
                          {item.pickup?.address || 'Điểm đón hiện tại'}
                       </Text>
                    </View>
                    <Text className="text-gray-400 text-[11px] font-Jakarta ml-4">Cách bạn {item.distance} km</Text>
                 </View>
                 <Text className="text-green-600 font-JakartaBold text-base">{formatCurrency(item.price)}</Text>
               </TouchableOpacity>
             )}
             ListEmptyComponent={() => (
               <View className="flex-1 items-center justify-center pt-10">
                  <Text className="text-gray-400 font-Jakarta text-xs">
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
          <View className="bg-white rounded-t-[40px] p-6 pb-10 shadow-2xl">
            {selectedOrder && (
              <>
                <View className="w-12 h-1.5 bg-gray-100 rounded-full self-center mb-6" />
                <Text className="text-gray-900 text-xl font-JakartaBold text-center mb-6">Chi tiết đơn hàng</Text>
                
                <View className="space-y-4">
                    <View className="flex-row justify-between items-center py-3 border-b border-gray-50">
                        <Text className="text-gray-400 font-Jakarta text-xs">Mã đơn hàng</Text>
                        <Text className="text-gray-900 font-JakartaBold text-xs">#{selectedOrder.orderId.slice(-8)}</Text>
                    </View>
                    <View className="flex-row justify-between items-center py-3 border-b border-gray-50">
                        <Text className="text-gray-400 font-Jakarta text-xs">Khoảng cách</Text>
                        <Text className="text-gray-900 font-JakartaBold text-xs">{selectedOrder.distance} km</Text>
                    </View>
                    <View className="py-4">
                        <Text className="text-gray-400 font-Jakarta text-[10px] uppercase mb-1">Giá cước thanh toán</Text>
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
                    <Text className="text-gray-400 font-JakartaBold">BỎ QUA</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className={`flex-[2] h-14 bg-green-500 rounded-2xl items-center justify-center shadow-sm ${isAccepting ? 'opacity-70' : ''}`}
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

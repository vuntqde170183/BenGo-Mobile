import { View, Text, Modal, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useRouter, useFocusEffect } from 'expo-router';
import { format } from 'date-fns';
import {
  MapCard,
  IncomingRequestModal,
  HotspotFinder,
} from '@/components/Driver/HomeScreen';
import { Switch } from 'react-native-switch';
import { Image } from 'react-native';
import CustomModal from "@/components/Common/CustomModal";
import { useAuth } from '@/context/AuthContext';
import { useDriverPendingOrders, useDriverStats, useDriverToggleStatus, useDriverAcceptOrder, useDriverUpdateLocation, useDriverActiveOrder, useDriverOrders } from '@/hooks/useDriver';
import { useHotspot } from '@/hooks/useHotspot';
import { PendingOrder } from '@/api/driver';
import { HotspotLocation } from '@/api/hotspot';

interface LocationState {
  address: string;
  city: string;
  coordinates: string;
  latitude: number;
  longitude: number;
  heading: number | null;
}

const DriverHome = () => {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [showHotspotModal, setShowHotspotModal] = useState(false);

  const [alertModal, setAlertModal] = useState({
    visible: false,
    title: "",
    message: "",
    onConfirm: undefined as (() => void) | undefined
  });

  const showAlert = (title: string, message: string, onConfirm?: () => void) => {
    setAlertModal({ visible: true, title, message, onConfirm });
  };

  const closeAlert = () => {
    setAlertModal((prev) => ({ ...prev, visible: false }));
    if (alertModal.onConfirm) {
      alertModal.onConfirm();
    }
  };

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

  const { data: rawPendingOrders = [], refetch: refetchOrders, isLoading: isLoadingOrders } = useDriverPendingOrders(
    currentLocation.latitude,
    currentLocation.longitude,
    10 // Bán kính
  );

  const pendingOrders = isOnline ? rawPendingOrders : [];
  const { data: activeOrder, isLoading: isLoadingActiveOrder } = useDriverActiveOrder();

  const { data: driverStats } = useDriverStats(
    today,
    today,
    { refetchInterval: 4000 }
  );

  const { data: todayOrdersData } = useDriverOrders({
    limit: 100,
    status: "DELIVERED",
    time: "today",
  });

  const calculatedTodayStats = useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    const transactions = todayOrdersData?.data?.data || [];

    const filtered = transactions.filter((order: any) => {
      if (!order.createdAt) return false;
      return format(new Date(order.createdAt), "yyyy-MM-dd") === today;
    });

    let grossEarnings = 0;
    filtered.forEach((order: any) => {
      grossEarnings += Number(order.totalPrice) || 0;
    });

    const netEarnings = grossEarnings * 0.85;

    return {
      totalNet: netEarnings,
      totalTrips: filtered.length,
    };
  }, [todayOrdersData]);

  // Mutations
  const { mutateAsync: toggleStatus, isPending: isTogglingStatus } = useDriverToggleStatus();
  const { mutateAsync: acceptOrder, isPending: isAccepting } = useDriverAcceptOrder();
  const { mutate: updateLocation } = useDriverUpdateLocation();

  // Hotspot
  const {
    hotspots,
    summary: hotspotSummary,
    isLoading: isLoadingHotspots,
    error: hotspotError,
    analyzedAt: hotspotAnalyzedAt,
    fetchHotspots,
    clearHotspots,
  } = useHotspot();
  const toggleOnlineStatus = async () => {
    if (currentLocation.latitude === 0 && currentLocation.longitude === 0) {
      showAlert('Lỗi', 'Vui lòng chờ xác định vị trí trước khi bật trạng thái');
      return;
    }

    const newStatus = !isOnline;
    setIsOnline(newStatus);

    try {
      await toggleStatus({
        isOnline: newStatus,
        location: {
          lat: currentLocation.latitude,
          lng: currentLocation.longitude,
        },
      });
    } catch (error: any) {
      setIsOnline(!newStatus);
      showAlert('Lỗi', 'Không thể cập nhật trạng thái hoạt động. Vui lòng thử lại.');
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    try {
      await acceptOrder(orderId);
      setShowOrderModal(false);
      setSelectedOrder(null);

      router.push(`/(driver)/active-trip/${orderId}` as any);
    } catch (error: any) {
      showAlert('Lỗi', `Không thể nhận chuyến: ${error.message || 'Vui lòng thử lại sau'}`);
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



  useFocusEffect(
    useCallback(() => {
      let interval: ReturnType<typeof setInterval>;
      if (isOnline && currentLocation.latitude !== 0) {
        interval = setInterval(() => {
          updateLocation({
            lat: currentLocation.latitude,
            lng: currentLocation.longitude,
            heading: currentLocation.heading || undefined
          } as any);
        }, 10000);
      }
      return () => {
        if (interval) clearInterval(interval);
      };
    }, [isOnline, currentLocation.latitude, currentLocation.longitude, updateLocation])
  );

  const formatCurrency = (amount?: number): string => {
    if (amount == null || isNaN(amount)) return '0 ₫';
    return amount.toLocaleString('vi-VN') + ' ₫';
  };

  const handleOrderPress = (order: PendingOrder) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const handleSearchHotspots = (radius?: number) => {
    fetchHotspots(currentLocation.latitude, currentLocation.longitude, radius);
  };

  const handleSelectHotspot = (hotspot: HotspotLocation) => {
    setShowHotspotModal(false);
    // Hotspot markers are already shown on the map through the hotspots state
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100" edges={['top']}>
      <Header
        isOnline={isOnline}
        onToggleStatus={toggleOnlineStatus}
        userName={user?.name}
        disabled={isTogglingStatus}
      />

      <View className="flex-1">
        <FlatList
          data={pendingOrders}
          keyExtractor={(item: PendingOrder) => item.orderId}
          ListHeaderComponent={
            <>
              {/* Stats Summary */}
              <SummaryCard
                totalEarnings={driverStats?.totalEarnings || calculatedTodayStats.totalNet}
                totalTrips={driverStats?.totalTrips || calculatedTodayStats.totalTrips}
              />

              {/* Active Trip Notification */}
              {activeOrder && (
                <TouchableOpacity
                  onPress={() => router.push(`/(driver)/active-trip/${activeOrder.id}` as any)}
                  className="mx-4 mb-4 bg-green-600 p-4 rounded-2xl flex-row items-center justify-between shadow-md"
                >
                  <View className="flex-row items-center flex-1">
                    <View className="w-10 h-10 bg-white/20 rounded-full items-center justify-center mr-3">
                      <Ionicons name="car-outline" size={24} color="white" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-JakartaBold text-sm uppercase">Bạn có chuyến đi đang thực hiện</Text>
                      <Text className="text-white text-xs font-JakartaMedium" numberOfLines={1}>
                        {activeOrder.pickupAddress || 'Đang thực hiện chuyến đi'}
                      </Text>
                    </View>
                  </View>
                  <View className="bg-white/20 px-3 py-1.5 rounded-full flex-row items-center">
                    <Text className="text-white font-JakartaBold text-xs mr-1">Quay lại</Text>
                    <Ionicons name="arrow-forward" size={14} color="white" />
                  </View>
                </TouchableOpacity>
              )}

              {/* Online Status Text */}
              <View className="px-4 mb-4">
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

              {/* Tall Map Section */}
              <View className="relative rounded-t-3xl overflow-hidden shadow-lg border border-gray-100" style={{ height: 500 }}>
                <MapCard
                  orders={pendingOrders}
                  onOrderPress={handleOrderPress}
                  hotspots={hotspots}
                  onHotspotPress={(h) => { }}
                />

                {/* Hotspot FAB */}
                <TouchableOpacity
                  className="absolute left-4 bottom-4 h-12 bg-white rounded-full items-center justify-center border border-orange-200 flex-row px-4"
                  style={{
                    shadowColor: "#F97316",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.15,
                    shadowRadius: 6,
                    elevation: 4,
                  }}
                  onPress={() => setShowHotspotModal(true)}
                >
                  <Ionicons name="flame" size={20} color="#F97316" />
                  <Text className="text-orange-600 font-JakartaBold text-xs ml-1.5">Điểm nóng</Text>
                  {hotspots.length > 0 && (
                    <View className="ml-1.5 w-5 h-5 bg-orange-500 rounded-full items-center justify-center">
                      <Text className="text-white text-[10px] font-JakartaBold">{hotspots.length}</Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Recenter FAB */}
                <TouchableOpacity
                  className="absolute right-4 bottom-4 w-12 h-12 bg-white rounded-full items-center justify-center border border-gray-100"
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

              {/* List Title */}
              <View className="px-4 py-4 border-b border-gray-100 flex-row justify-between items-center bg-white">
                <Text className="text-gray-700 font-JakartaBold text-lg">Đơn hàng khả dụng ({pendingOrders.length})</Text>
                <TouchableOpacity onPress={() => refetchOrders()}>
                  <Ionicons name="refresh" size={24} color="#10B981" />
                </TouchableOpacity>
              </View>
            </>
          }
          renderItem={({ item }: { item: PendingOrder }) => (
            <TouchableOpacity
              onPress={() => handleOrderPress(item)}
              className="flex-row items-center justify-between px-4 py-4 border-b border-gray-100 bg-white active:bg-gray-50"
            >
              <View className="flex-1 mr-4">
                <View className="flex-row items-center mb-1">
                  <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                  <Text className="text-gray-700 font-JakartaBold text-base flex-1" numberOfLines={1}>
                    {item.pickup?.address || 'Điểm đón hiện tại'}
                  </Text>
                </View>
                <Text className="text-gray-500 text-base font-Jakarta ml-4">Cách bạn {item.distance} km</Text>
              </View>
              <Text className="text-green-600 font-JakartaBold text-base">{formatCurrency(item.price)}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={() => (
            <View className="items-center justify-center py-20 bg-white">
              <Ionicons
                name={isOnline ? "search-outline" : "cloud-offline-outline"}
                size={60}
                color="#9CA3AF"
              />
              <Text className="text-gray-500 font-Jakarta text-base mt-2 px-10 text-center">
                {isOnline ? 'Chưa tìm thấy đơn hàng nào gần đây' : 'Bật trực tuyến để xem đơn hàng'}
              </Text>
            </View>
          )}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <IncomingRequestModal
        visible={showOrderModal}
        order={selectedOrder}
        onAccept={handleAcceptOrder}
        onDecline={() => {
          setShowOrderModal(false);
          setSelectedOrder(null);
        }}
        onTimeout={() => {
          setShowOrderModal(false);
          setSelectedOrder(null);
        }}
        isAccepting={isAccepting}
        isOnline={isOnline}
      />

      <HotspotFinder
        visible={showHotspotModal}
        onClose={() => setShowHotspotModal(false)}
        hotspots={hotspots}
        summary={hotspotSummary}
        isLoading={isLoadingHotspots}
        error={hotspotError}
        analyzedAt={hotspotAnalyzedAt}
        onSearch={handleSearchHotspots}
        onSelectHotspot={handleSelectHotspot}
      />

      <CustomModal
        visible={alertModal.visible}
        title={alertModal.title}
        message={alertModal.message}
        onClose={closeAlert}
      />
    </SafeAreaView>
  );
};

// Local Components (Small components < 100 lines)
interface HeaderProps {
  isOnline: boolean;
  onToggleStatus: () => void;
  userName?: string;
  avatarUrl?: string;
  disabled?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  isOnline,
  onToggleStatus,
  userName,
  avatarUrl,
  disabled = false,
}) => {
  return (
    <View
      className="flex-row items-center justify-between px-4 py-3 bg-white"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      }}
    >
      <View className="flex-row items-center">
        <View className="w-14 h-14 bg-gray-100 rounded-full items-center justify-center mr-3 overflow-hidden">
          <Image
            source={{ uri: avatarUrl || `https://api.dicebear.com/9.x/avataaars/png?seed=${userName || 'Driver'}` }}
            className="w-full h-full"
          />
        </View>
        <View className="ml-3">
          <Text className="text-gray-700 text-base font-JakartaBold leading-tight">{userName || 'Tài xế'}</Text>
          <Text className={`text-sm font-JakartaMedium ${isOnline ? 'text-green-500' : 'text-gray-500'}`}>
            {isOnline ? '● Đang trực tuyến' : '○ Ngoại tuyến'}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center">
        <Switch
          value={isOnline}
          onValueChange={onToggleStatus}
          disabled={disabled}
          activeText={""}
          inActiveText={""}
          circleSize={20}
          barHeight={24}
          circleBorderWidth={0}
          backgroundActive={"#16A34A"}
          backgroundInactive={"#E5E5E5"}
          circleActiveColor={"#ffffff"}
          circleInActiveColor={"#f4f3f4"}
          changeValueImmediately={true}
          renderActiveText={false}
          renderInActiveText={false}
          switchLeftPx={2}
          switchRightPx={2}
          switchWidthMultiplier={2.2}
          switchBorderRadius={12}
        />
      </View>
    </View>
  );
};

interface SummaryCardProps {
  totalEarnings: number;
  totalTrips: number;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ totalEarnings, totalTrips }) => {
  const formatCurrency = (amount?: number): string => {
    if (amount == null || isNaN(amount)) return '0 ₫';
    return amount.toLocaleString('vi-VN') + ' ₫';
  };

  return (
    <View className="mx-4 my-3">
      <View
        className="bg-green-600 p-4 rounded-2xl flex-row items-center justify-between shadow-md"
      >
        <View className="bg-white/20 p-3 rounded-2xl mr-4">
          <Ionicons name="calendar-outline" size={24} color="white" />
        </View>
        <View className="flex-1">
          <Text className="text-white/80 font-JakartaSemiBold text-sm uppercase mb-0.5">Thu nhập hôm nay: {format(new Date(), "dd/MM/yyyy")}</Text>
          <Text className="text-white font-JakartaExtraBold text-2xl">{formatCurrency(totalEarnings)}</Text>
        </View>
        <View className="bg-white/20 px-3 py-1.5 rounded-2xl items-center border border-white/10">
          <Text className="text-white font-JakartaBold text-lg leading-6">{totalTrips}</Text>
          <Text className="text-white/80 font-JakartaMedium text-[10px] uppercase">Chuyến</Text>
        </View>
      </View>
    </View>
  );
};

export default DriverHome;

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useDriverOrders } from '@/hooks/useDriver';
import { useOrderHistory } from '@/hooks/useOrders';
import TripCard from '@/components/Driver/ActivityScreen/TripCard';
import OrderItemCard from '@/components/Customer/ActivitiesScreen/OrderItemCard';
import InputField from '@/components/Common/InputField';

const FILTERS = [
  { label: 'Tất cả', value: 'ALL' },
  { label: 'Hoàn thành', value: 'DELIVERED' },
  { label: 'Đã hủy', value: 'CANCELLED' },
];

const TIME_FILTERS = [
  { label: 'Hôm nay', value: 'today' },
  { label: '7 ngày qua', value: 'week' },
];

const OrdersScreen = () => {
  const { user } = useAuth();
  const isDriver = user?.role?.toLowerCase() === 'driver';

  const [orders, setOrders] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [timeFilter, setTimeFilter] = useState('today');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const driverQuery = useDriverOrders({
    page,
    limit: 10,
    status: statusFilter,
    search,
    time: timeFilter,
    enabled: isDriver
  });

  const customerQuery = useOrderHistory({
    status: statusFilter,
    page,
    limit: 10,
    search,
    time: timeFilter,
    enabled: !isDriver
  });

  const query = isDriver ? driverQuery : customerQuery;
  const { data, isLoading: loading, isFetching: loadingMore, refetch } = query;
  useEffect(() => {
    if (data) {
      const rawItems = data?.data || data;
      const newItems = Array.isArray(rawItems) ? rawItems : [];
      if (page === 1) {
        setOrders(newItems);
      } else if (newItems.length > 0) {
        setOrders(prev => {
          const existingIds = new Set(prev.map(o => o.id || o._id));
          const uniqueNew = newItems.filter((o: any) => !existingIds.has(o.id || o._id));
          return [...prev, ...uniqueNew];
        });
      }

      setHasMore(newItems.length >= 10);
    }
  }, [data, page, isDriver]);

  useEffect(() => {
    setPage(1);
    setOrders([]);
    setHasMore(true);
  }, [statusFilter, timeFilter, search]);

  const onRefresh = () => {
    setPage(1);
    refetch();
  };

  const onEndReached = () => {
    if (!loading && !loadingMore && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  const handleTripPress = (id: string) => {
    const route = isDriver ? `/(driver)/history/${id}` : `/(root)/order-detail/${id}`;
    router.push(route as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100" edges={['top']}>
      {/* Header & Search */}
      <View className="px-4 py-2 bg-white mb-4">
        <Text className="text-xl font-JakartaBold text-gray-700 mb-4">Hoạt động</Text>

        <InputField
          icon="search-outline"
          placeholder="Tìm theo mã đơn hoặc địa chỉ..."
          value={search}
          onChangeText={setSearch}
          containerStyle="bg-gray-50 border-none mb-2"
          inputStyle="text-base font-JakartaMedium"
          iconRight={
            search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </TouchableOpacity>
            )
          }
        />

        {/* Status Tabs */}
        <View className="flex-row border-b border-gray-100 mb-4">
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.value}
              onPress={() => setStatusFilter(f.value)}
              className={`flex-1 py-3 items-center ${statusFilter === f.value ? 'border-b-2 border-green-600' : ''}`}
            >
              <Text className={`text-base font-JakartaBold ${statusFilter === f.value ? 'text-green-600' : 'text-gray-500'}`}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Time Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-2">
          {TIME_FILTERS.map((t) => (
            <TouchableOpacity
              key={t.value}
              onPress={() => setTimeFilter(t.value)}
              className={`mr-2 px-4 py-1.5 rounded-full border ${timeFilter === t.value ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100'}`}
            >
              <Text className={`text-base font-JakartaMedium ${timeFilter === t.value ? 'text-green-600' : 'text-gray-500'}`}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* List */}
      <FlatList
        data={orders}
        keyExtractor={(item, index) => `${item?.id || index}-${index}`}
        renderItem={({ item }) => (
          isDriver ? (
            <TripCard item={item} onPress={handleTripPress} />
          ) : (
            <View className="px-4">
              <OrderItemCard order={item} />
            </View>
          )
        )}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={loading && page === 1} onRefresh={onRefresh} colors={['#22C55E']} />
        }
        ListEmptyComponent={() => (
          !loading ? (
            <View className="flex-1 items-center justify-center pt-20">
              <View className="w-20 h-20 bg-white rounded-full items-center justify-center mb-4 shadow-sm">
                <Ionicons name="document-text-outline" size={40} color="#CBD5E1" />
              </View>
              <Text className="text-gray-500 font-JakartaMedium text-base">Không tìm thấy đơn hàng nào</Text>
            </View>
          ) : null
        )}
        ListFooterComponent={() => (
          loadingMore ? (
            <View className="py-4">
              <ActivityIndicator size="small" color="#22C55E" />
            </View>
          ) : <View className="h-20" />
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </SafeAreaView>
  );
};

export default OrdersScreen;

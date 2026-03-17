import React, { useState, useEffect, useCallback } from 'react';
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
import { OrderHistoryItem } from '@/api/driver';
import { useDriverOrders } from '@/hooks/useDriver';
import TripCard from '@/components/Driver/ActivityScreen/TripCard';
import InputField from '@/components/Common/InputField';

const FILTERS = [
  { label: 'Tất cả', value: 'ALL' },
  { label: 'Hoàn thành', value: 'DELIVERED' },
  { label: 'Đã hủy', value: 'CANCELLED' },
];

const TIME_FILTERS = [
  { label: 'Hôm nay', value: 'today' },
  { label: '7 ngày qua', value: 'week' },
  { label: 'Tùy chọn', value: 'custom' },
];

const DriverHistory = () => {
  const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [timeFilter, setTimeFilter] = useState('today');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const { data, isLoading: loading, isFetching: loadingMore, refetch } = useDriverOrders({
    page,
    limit: 10,
    status: statusFilter,
    search,
    time: timeFilter
  });

  useEffect(() => {
    if (data?.data?.data) {
      if (page === 1) {
        setOrders(data.data.data);
      } else {
        setOrders(prev => [...prev, ...data.data.data]);
      }
      setHasMore(data.data.data.length === 10);
    }
  }, [data, page]);

  useEffect(() => {
    setPage(1);
    setOrders([]);
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
    router.push(`/(driver)/history/${id}` as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100" edges={['top']}>
      {/* Header & Search */}
      <View className="px-4 py-2">
        <Text className="text-2xl font-JakartaBold text-gray-900 mb-4">Hoạt động</Text>

        <InputField
          icon="search-outline"
          placeholder="Tìm theo mã đơn hoặc địa chỉ..."
          value={search}
          onChangeText={setSearch}
          containerStyle="bg-white border-none mb-2"
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
        <View className="flex-row border-b border-gray-200 mb-4">
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
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TripCard item={item} onPress={handleTripPress} />
        )}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={loading && page === 1} onRefresh={onRefresh} colors={['#22C55E']} />
        }
        ListEmptyComponent={() => (
          !loading ? (
            <View className="flex-1 items-center justify-center pt-20">
              <View className="w-20 h-20 bg-gray-50 rounded-full items-center justify-center mb-4">
                <Ionicons name="document-text-outline" size={40} color="#CBD5E1" />
              </View>
              <Text className="text-gray-500 font-JakartaMedium text-base">Không tìm thấy chuyến đi nào</Text>
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
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </SafeAreaView>
  );
};

export default DriverHistory;

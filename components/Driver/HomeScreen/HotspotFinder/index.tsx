import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HotspotLocation } from '@/api/hotspot';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface HotspotFinderProps {
  visible: boolean;
  onClose: () => void;
  hotspots: HotspotLocation[];
  summary: string;
  isLoading: boolean;
  error: string | null;
  analyzedAt: string | null;
  onSearch: (radius?: number) => void;
  onSelectHotspot: (hotspot: HotspotLocation) => void;
}

const RADIUS_OPTIONS = [
  { label: '5 km', value: 5 },
  { label: '10 km', value: 10 },
  { label: '15 km', value: 15 },
];

const CROWD_LEVEL_CONFIG = {
  high: {
    label: 'Rất đông',
    color: '#EF4444',
    bgColor: '#FEE2E2',
    icon: 'flame' as const,
  },
  medium: {
    label: 'Đông vừa',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    icon: 'people' as const,
  },
  low: {
    label: 'Đông nhẹ',
    color: '#10B981',
    bgColor: '#D1FAE5',
    icon: 'person' as const,
  },
};

const CATEGORY_ICONS: Record<string, string> = {
  shopping: 'cart',
  food: 'restaurant',
  transport: 'bus',
  hospital: 'medkit',
  school: 'school',
  entertainment: 'game-controller',
  office: 'briefcase',
  market: 'storefront',
  tourism: 'camera',
};

const HotspotFinder: React.FC<HotspotFinderProps> = ({
  visible,
  onClose,
  hotspots,
  summary,
  isLoading,
  error,
  analyzedAt,
  onSearch,
  onSelectHotspot,
}) => {
  const [selectedRadius, setSelectedRadius] = useState(5);

  const handleSearch = () => {
    onSearch(selectedRadius);
  };

  const formatTime = (isoString: string | null) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const renderHotspotItem = ({ item, index }: { item: HotspotLocation; index: number }) => {
    const crowdConfig = CROWD_LEVEL_CONFIG[item.crowdLevel] || CROWD_LEVEL_CONFIG.medium;
    const iconName = (CATEGORY_ICONS[item.category] || 'location') as any;

    return (
      <TouchableOpacity
        onPress={() => onSelectHotspot(item)}
        activeOpacity={0.7}
        className="mb-3"
      >
        <View
          className="bg-white rounded-2xl p-4 border border-gray-100"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          {/* Top row: rank + name + crowd level badge */}
          <View className="flex-row items-start justify-between mb-2">
            <View className="flex-row items-center flex-1 mr-3">
              {/* Rank number */}
              <View
                className="w-8 h-8 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: index < 3 ? '#FEF3C7' : '#F3F4F6' }}
              >
                <Text
                  className="font-JakartaBold text-sm"
                  style={{ color: index < 3 ? '#D97706' : '#6B7280' }}
                >
                  {index + 1}
                </Text>
              </View>
              {/* Category icon + name */}
              <View className="flex-1">
                <View className="flex-row items-center mb-0.5">
                  <Ionicons name={iconName} size={14} color="#6B7280" />
                  <Text className="text-gray-800 font-JakartaBold text-base ml-1.5" numberOfLines={1}>
                    {item.name}
                  </Text>
                </View>
                <Text className="text-gray-500 text-xs font-Jakarta" numberOfLines={1}>
                  {item.address}
                </Text>
              </View>
            </View>

            {/* Crowd level badge */}
            <View
              className="px-2.5 py-1 rounded-full flex-row items-center"
              style={{ backgroundColor: crowdConfig.bgColor }}
            >
              <Ionicons name={crowdConfig.icon} size={12} color={crowdConfig.color} />
              <Text
                className="text-xs font-JakartaBold ml-1"
                style={{ color: crowdConfig.color }}
              >
                {crowdConfig.label}
              </Text>
            </View>
          </View>

          {/* Reason */}
          <View className="ml-11 mb-2">
            <Text className="text-gray-600 text-sm font-Jakarta leading-5">
              {item.reason}
            </Text>
          </View>

          {/* Bottom row: estimated customers + navigate button */}
          <View className="ml-11 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="people-outline" size={14} color="#9CA3AF" />
              <Text className="text-gray-400 text-xs font-Jakarta ml-1">
                ~{item.estimatedCustomers}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="navigate-outline" size={14} color="#10B981" />
              <Text className="text-green-600 text-xs font-JakartaBold ml-1">
                Xem trên bản đồ
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/40">
        <TouchableOpacity className="h-20" activeOpacity={1} onPress={onClose} />
        <View
          className="flex-1 bg-gray-50 rounded-t-3xl overflow-hidden"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 20,
          }}
        >
          {/* Handle bar */}
          <View className="items-center pt-3 pb-1">
            <View className="w-10 h-1 bg-gray-300 rounded-full" />
          </View>

          {/* Header */}
          <View className="px-5 pt-2 pb-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-orange-100 rounded-xl items-center justify-center mr-3">
                  <Ionicons name="flame" size={22} color="#F97316" />
                </View>
                <View>
                  <Text className="text-gray-800 font-JakartaBold text-lg">
                    Điểm nóng khách hàng
                  </Text>
                  <Text className="text-gray-400 text-xs font-Jakarta">
                    Dự đoán bởi AI · Dựa trên vị trí & thời gian
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={onClose}
                className="w-8 h-8 bg-gray-200 rounded-full items-center justify-center"
              >
                <Ionicons name="close" size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Radius selector */}
          <View className="px-5 mb-4">
            <Text className="text-gray-500 text-xs font-JakartaMedium mb-2 uppercase">
              Bán kính tìm kiếm
            </Text>
            <View className="flex-row">
              {RADIUS_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setSelectedRadius(opt.value)}
                  className={`flex-1 py-2.5 mx-1 rounded-xl items-center border ${selectedRadius === opt.value
                    ? 'bg-green-600 border-green-600'
                    : 'bg-white border-gray-200'
                    }`}
                >
                  <Text
                    className={`text-sm font-JakartaBold ${selectedRadius === opt.value ? 'text-white' : 'text-gray-600'
                      }`}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Search button */}
          <View className="px-5 mb-4">
            <TouchableOpacity
              onPress={handleSearch}
              disabled={isLoading}
              className={`py-3.5 rounded-2xl flex-row items-center justify-center ${isLoading ? 'bg-gray-300' : 'bg-green-600'
                }`}
              style={{
                shadowColor: '#16A34A',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isLoading ? 0 : 0.3,
                shadowRadius: 8,
                elevation: isLoading ? 0 : 6,
              }}
            >
              {isLoading ? (
                <>
                  <ActivityIndicator color="white" size="small" />
                  <Text className="text-white font-JakartaBold text-base ml-2">
                    AI đang phân tích...
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="search" size={20} color="white" />
                  <Text className="text-white font-JakartaBold text-base ml-2">
                    Tìm điểm nóng
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Error display */}
          {error && (
            <View className="mx-5 mb-4 bg-red-50 border border-red-200 p-3 rounded-xl flex-row items-start">
              <Ionicons name="alert-circle" size={18} color="#EF4444" />
              <Text className="text-red-600 text-sm font-Jakarta ml-2 flex-1">{error}</Text>
            </View>
          )}

          {/* Loading skeleton */}
          {isLoading && (
            <View className="px-5">
              {[1, 2, 3].map((i) => (
                <View key={i} className="bg-white rounded-2xl p-4 mb-3 border border-gray-100">
                  <View className="flex-row items-center">
                    <View className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
                    <View className="ml-3 flex-1">
                      <View className="w-3/4 h-4 bg-gray-200 rounded-full mb-2" />
                      <View className="w-1/2 h-3 bg-gray-100 rounded-full" />
                    </View>
                    <View className="w-16 h-6 bg-gray-200 rounded-full" />
                  </View>
                  <View className="ml-11 mt-3">
                    <View className="w-full h-3 bg-gray-100 rounded-full mb-1.5" />
                    <View className="w-2/3 h-3 bg-gray-100 rounded-full" />
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Summary */}
          {!isLoading && summary ? (
            <View className="mx-5 mb-3 bg-blue-50 border border-blue-200 p-3 rounded-xl flex-row items-start">
              <Ionicons name="analytics" size={18} color="#3B82F6" />
              <View className="ml-2 flex-1">
                <Text className="text-blue-800 text-sm font-JakartaMedium">{summary}</Text>
                {analyzedAt && (
                  <Text className="text-blue-400 text-xs font-Jakarta mt-1">
                    Cập nhật lúc {formatTime(analyzedAt)}
                  </Text>
                )}
              </View>
            </View>
          ) : null}

          {/* Results list */}
          {!isLoading && hotspots.length > 0 && (
            <FlatList
              data={Array.from(new Map(hotspots.map((h) => [h.id, h])).values())}
              keyExtractor={(item, index) => `${item.id}-${index}`}
              renderItem={renderHotspotItem}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
            />
          )}

          {/* Empty state (after search, no results) */}
          {!isLoading && !error && hotspots.length === 0 && summary === '' && (
            <View className="flex-1 items-center justify-center px-10">
              <View className="w-20 h-20 bg-orange-50 rounded-full items-center justify-center mb-4">
                <Ionicons name="location-outline" size={40} color="#F97316" />
              </View>
              <Text className="text-gray-700 font-JakartaBold text-lg text-center mb-2">
                Khám phá điểm nóng
              </Text>
              <Text className="text-gray-400 font-Jakarta text-sm text-center leading-5">
                Nhấn "Tìm điểm nóng" để AI phân tích và gợi ý những địa điểm có nhiều khách hàng tiềm năng xung quanh bạn
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default HotspotFinder;

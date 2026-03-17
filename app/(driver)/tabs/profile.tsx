import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useFetch, fetchAPI } from "@/lib/fetch";
import { useState, useCallback } from "react";
import CustomButton from "@/components/Common/CustomButton";
import { User, DriverProfile, DriverDocument } from "@/types/type";

const ProfileScreen = () => {
  const { user, logout, token } = useAuth();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  // P4.1: Lấy dữ liệu profile và stats
  const {
    data: profileData,
    loading: profileLoading,
    refetch: refetchProfile
  } = useFetch<any>("/(api)/auth/profile");

  // P4.3: Lấy trạng thái giấy tờ
  const {
    data: documentData,
    loading: docLoading,
    refetch: refetchDocs
  } = useFetch<{ documents: DriverDocument[]; profileStatus: string }>("/(api)/driver/documents");

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchProfile(), refetchDocs()]);
    setRefreshing(false);
  }, []);

  const handleLogout = () => {
    Alert.alert(
      "Đăng xuất",
      "Bạn có chắc chắn muốn đăng xuất khỏi tài khoản?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Đăng xuất",
          style: "destructive",
          onPress: async () => {
            try {
              // P3: Gửi API cập nhật trạng thái Offline
              await fetchAPI("/(api)/driver/status", {
                method: "PUT",
                body: JSON.stringify({ isOnline: false }),
              });
              logout();
              router.replace("/(auth)/sign-in");
            } catch (error) {
              console.error("Logout error:", error);
              logout(); // Vẫn logout local nếu API lỗi
              router.replace("/(auth)/sign-in");
            }
          },
        },
      ]
    );
  };

  if (profileLoading && !refreshing) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#22C55E" />
      </View>
    );
  }

  const driverStats = profileData?.stats || {
    totalTrips: 0,
    acceptanceRate: 0,
    seniority: "0 tháng",
  };

  const rank = profileData?.rank || "Silver"; // Mock rank if not in API
  const rating = profileData?.rating || 5.0;

  return (
    <SafeAreaView className="flex-1 bg-gray-100" edges={['top']}>
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* P1: Driver Profile Header */}
        <View className="relative h-64">
          <Image
            source={{ uri: `https://picsum.photos/seed/${user?.id || 'bengo'}/800/400` }}
            className="h-48 w-full"
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.5)"]}
            className="absolute h-48 w-full"
          />

          <View className="absolute top-24 left-0 right-0 items-center">
            <View className="relative">
              <View className="w-[100px] h-[100px] rounded-full bg-white p-1 shadow-lg">
                <Image
                  source={{ uri: `https://api.dicebear.com/9.x/bottts/png?seed=${user?.name || 'Felix'}` }}
                  className="w-full h-full rounded-full"
                />
              </View>
              <TouchableOpacity
                className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-md"
                onPress={() => Alert.alert("Thông báo", "Chức năng cập nhật ảnh đang phát triển")}
              >
                <Ionicons name="camera" size={18} color="#22C55E" />
              </TouchableOpacity>
            </View>

            <Text className="text-2xl font-JakartaBold text-gray-900 mt-4">
              {user?.name || "Tài xế BenGo"}
            </Text>

            <View className="flex-row items-center mt-2 gap-2">
              <View className="flex-row items-center px-3 py-1 bg-amber-100 rounded-full border border-amber-200">
                <Ionicons name="ribbon" size={14} color="#D97706" />
                <Text className="text-amber-700 font-JakartaBold ml-1 text-xs">
                  {rank.toUpperCase()}
                </Text>
              </View>
              <View className="flex-row items-center px-3 py-1 bg-green-100 rounded-full border border-green-200">
                <Ionicons name="star" size={14} color="#EAB308" />
                <Text className="text-green-700 font-JakartaBold ml-1 text-xs">
                  {rating.toFixed(1)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View className="px-4 mt-16">
          {/* P2: Performance Stats Card */}
          <View
            className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex-row items-center"
          >
            <View className="flex-1 items-center">
              <Ionicons name="car" size={24} color="#3B82F6" />
              <Text className="text-gray-500 text-sm mt-1 font-Jakarta">Số chuyến</Text>
              <Text className="text-gray-900 font-JakartaBold mt-1">{driverStats.totalTrips || 0}</Text>
            </View>

            <View className="w-[1px] h-10 bg-gray-100" />

            <View className="flex-1 items-center">
              <Ionicons name="checkmark-circle-outline" size={24} color="#10B981" />
              <Text className="text-gray-500 text-sm mt-1 font-Jakarta">Tỷ lệ nhận</Text>
              <Text className="text-gray-900 font-JakartaBold mt-1">{driverStats.acceptanceRate || 0}%</Text>
            </View>

            <View className="w-[1px] h-10 bg-gray-100" />

            <View className="flex-1 items-center">
              <Ionicons name="time-outline" size={24} color="#F59E0B" />
              <Text className="text-gray-500 text-sm mt-1 font-Jakarta">Thâm niên</Text>
              <Text className="text-gray-900 font-JakartaBold mt-1">{driverStats.seniority || "New"}</Text>
            </View>
          </View>

          {/* P3: Action Menu List */}
          <View className="mt-4 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <MenuActionItem
              icon="person-circle-outline"
              label="Chỉnh sửa hồ sơ"
              onPress={() => Alert.alert("Thông báo", "Chuyển đến màn hình Chỉnh sửa hồ sơ")}
            />
            <Divider />
            <MenuActionItem
              icon="document-attach-outline"
              label="Quản lý giấy tờ"
              status={documentData?.profileStatus}
              onPress={() => Alert.alert("Thông báo", "Chuyển đến màn hình Quản lý giấy tờ")}
            />
            <Divider />
            <MenuActionItem
              icon="settings-outline"
              label="Cài đặt ứng dụng"
              onPress={() => Alert.alert("Thông báo", "Chuyển đến màn hình Cài đặt")}
            />
            <Divider />
            <MenuActionItem
              icon="help-buoy-outline"
              label="Trung tâm hỗ trợ"
              onPress={() => Alert.alert("Thông báo", "Chuyển đến Trung tâm hỗ trợ")}
            />
          </View>

          {/* P4: Logout Section */}
          <CustomButton
            title="Đăng xuất"
            onPress={handleLogout}
            bgVariant="danger"
            textVariant="danger"
            IconRight={() => <Ionicons name="log-out-outline" size={24} color="#FFF" />}
            className="my-8"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const MenuActionItem = ({
  icon,
  label,
  onPress,
  status
}: {
  icon: any;
  label: string;
  onPress: () => void;
  status?: string;
}) => (
  <TouchableOpacity
    onPress={onPress}
    className="flex-row items-center p-4 active:bg-gray-50"
  >
    <View className="bg-green-50 w-12 h-12 rounded-2xl items-center justify-center mr-3">
      <Ionicons name={icon} size={22} color="#10B981" />
    </View>
    <View className="flex-1 flex-row items-center justify-between">
      <Text className="font-JakartaBold text-gray-700 text-base">{label}</Text>
      <View className="flex-row items-center">
        {status && (
          <View className={`px-2 py-0.5 rounded-full mr-2 ${status === 'APPROVED' ? 'bg-green-100' : status === 'PENDING' ? 'bg-amber-100' : 'bg-red-100'
            }`}>
            <Text className={`text-sm font-JakartaBold ${status === 'APPROVED' ? 'text-green-700' : status === 'PENDING' ? 'text-amber-700' : 'text-red-700'
              }`}>
              {status}
            </Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
      </View>
    </View>
  </TouchableOpacity>
);

const Divider = () => <View className="h-[1px] bg-gray-50 mx-4" />;

export default ProfileScreen;


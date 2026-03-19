import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";

import { useDriverDocuments } from "@/hooks/useDriver";
import { useProfile } from "@/hooks/useProfile";
import CustomButton from "@/components/Common/CustomButton";
import { useAuth } from "@/context/AuthContext";

const StatusBadge = ({ status }: { status: string }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "APPROVED":
        return { label: "Đã duyệt", color: "text-green-700", bg: "bg-green-100" };
      case "REJECTED":
        return { label: "Từ chối", color: "text-red-700", bg: "bg-red-100" };
      case "LOCKED":
        return { label: "Đã khóa", color: "text-gray-700", bg: "bg-gray-100" };
      default:
        return { label: "Chờ duyệt", color: "text-amber-700", bg: "bg-amber-100" };
    }
  };
  const config = getStatusConfig(status);
  return (
    <View className={`px-2 py-0.5 rounded-full ${config.bg}`}>
      <Text className={`text-[10px] font-JakartaBold uppercase ${config.color}`}>
        {config.label}
      </Text>
    </View>
  );
};

const DocumentCategoryCard = ({
  title,
  status,
  icon,
  onPress
}: {
  title: string;
  status: string;
  icon: any;
  onPress: () => void;
}) => (
  <TouchableOpacity
    activeOpacity={0.7}
    onPress={onPress}
    className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm mb-4 flex-row items-center"
  >
    <View className="bg-green-50 w-12 h-12 rounded-2xl items-center justify-center mr-4 border border-green-200">
      <Ionicons name={icon} size={24} color="#10B981" />
    </View>
    <View className="flex-1">
      <Text className="text-gray-700 font-JakartaBold text-base">{title}</Text>
      <View className="flex-row items-center mt-1">
        <StatusBadge status={status} />
      </View>
    </View>
    <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
  </TouchableOpacity>
);

const DocumentManagementScreen = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const userId = (user?._id || user?.id || null) as string | null;

  const { data: profileData, isLoading: profileLoading } = useProfile();

  const effectiveUserId = userId || profileData?._id || profileData?.id || null;

  const { data: docData, isLoading: docsLoading } = useDriverDocuments(effectiveUserId);
  const driverProfile = docData?.data?.driverProfile;
  const profileStatus = driverProfile?.status || profileData?.status || "PENDING";
  const rejectionReason = driverProfile?.rejectionReason;

  const getBannerColors = (status: string): readonly [string, string] => {
    switch (status) {
      case "APPROVED":
        return ["#059669", "#10B981"] as const;
      case "REJECTED":
        return ["#DC2626", "#EF4444"] as const;
      case "LOCKED":
        return ["#374151", "#4B5563"] as const;
      default:
        return ["#D97706", "#F59E0B"] as const;
    }
  };

  const getBannerMessage = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "Hồ sơ của bạn đã được phê duyệt. Sẵn sàng bắt đầu chuyến xe!";
      case "REJECTED":
        return "Cần cập nhật lại thông tin. Vui lòng kiểm tra lý do từ chối.";
      case "LOCKED":
        return "Tài khoản của bạn tạm thời bị khóa. Liên hệ hỗ trợ để biết thêm.";
      default:
        return "Hồ sơ của bạn đang được ban quản trị xét duyệt.";
    }
  };

  if (docsLoading && profileLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100">
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100" edges={["top"]}>
      <StatusBar style="light" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="flex-1 text-center font-JakartaBold text-lg text-gray-700">
          Quản lý giấy tờ
        </Text>
        <View className="w-8" />
      </View>

      <ScrollView className="flex-1 px-4 pt-5" showsVerticalScrollIndicator={false}>
        {/* C1: Banner Gradient */}
        <LinearGradient
          colors={getBannerColors(profileStatus)}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ padding: 24, borderRadius: 28, marginBottom: 24, shadowOpacity: 0.1, shadowRadius: 10 }}
        >
          <View className="flex-row items-center">
            <View className="bg-white/30 w-14 h-14 rounded-2xl items-center justify-center mr-4">
              <Ionicons
                name={profileStatus === "APPROVED" ? "shield-checkmark" : profileStatus === "REJECTED" ? "warning" : "hourglass-outline"}
                size={32}
                color="white"
              />
            </View>
            <View className="flex-1">
              <Text className="text-white font-JakartaBold text-xl leading-7">
                {profileStatus === "APPROVED" ? "Hồ sơ hoàn tất" : "Trạng thái hồ sơ"}
              </Text>
              <Text className="text-white/90 font-Jakarta text-sm mt-1">
                {getBannerMessage(profileStatus)}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Rejection Reason if any */}
        {profileStatus === "REJECTED" && rejectionReason && (
          <View className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-4">
            <Text className="text-red-700 font-JakartaBold text-sm mb-1 uppercase">Lý do từ chối:</Text>
            <Text className="text-red-600 font-Jakarta text-sm">{rejectionReason}</Text>
          </View>
        )}

        {/* C2: Document Item Cards */}
        <Text className="text-gray-700 font-JakartaBold text-lg mb-4 ml-1">Chi tiết giấy tờ</Text>

        <DocumentCategoryCard
          title="Thông tin Định danh"
          status={profileStatus}
          icon="id-card-outline"
          onPress={() => router.push("/update-verification")}
        />

        <DocumentCategoryCard
          title="Bằng lái xe"
          status={profileStatus}
          icon="car-outline"
          onPress={() => router.push("/update-verification")}
        />

        <DocumentCategoryCard
          title="Thông tin Xe & Đăng ký"
          status={profileStatus}
          icon="document-text-outline"
          onPress={() => router.push("/update-verification")}
        />

        <DocumentCategoryCard
          title="Tài khoản Ngân hàng"
          status={profileStatus}
          icon="business-outline"
          onPress={() => router.push("/update-verification")}
        />

        <View className="h-40" />
      </ScrollView>
    </SafeAreaView>
  );
};

export default DocumentManagementScreen;

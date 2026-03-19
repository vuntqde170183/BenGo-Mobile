import React, { useState } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    RefreshControl,
    Dimensions,
    Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import CustomModal from "@/components/Common/CustomModal";

const MenuItem = ({ icon, label, onPress }: { icon: any; label: string; onPress: () => void }) => (
    <TouchableOpacity
        onPress={onPress}
        className="flex-row items-center py-4 border-b border-neutral-50 px-2"
    >
        <View className="w-10 h-10 items-center justify-center bg-neutral-50 rounded-xl mr-4">
            <Ionicons name={icon} size={22} color="#16A34A" />
        </View>
        <Text className="flex-1 text-base font-JakartaMedium text-neutral-700">{label}</Text>
        <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
    </TouchableOpacity>
);

const CustomerProfileScreen = () => {
    const { logout } = useAuth();
    const { data: profile, isLoading, refetch } = useProfile();
    const [refreshing, setRefreshing] = useState(false);

    const [alertModal, setAlertModal] = useState({
        visible: false,
        title: "",
        message: "",
        primaryButtonText: "Đóng",
        secondaryButtonText: "",
        onConfirm: undefined as (() => void) | undefined,
        onCancel: undefined as (() => void) | undefined
    });

    const showAlert = (title: string, message: string, onConfirm?: () => void, primaryButtonText = "Đóng", secondaryButtonText = "", onCancel?: () => void) => {
        setAlertModal({ visible: true, title, message, onConfirm, primaryButtonText, secondaryButtonText, onCancel });
    };

    const closeAlert = () => {
        setAlertModal((prev) => ({ ...prev, visible: false }));
        if (alertModal.onConfirm) {
            alertModal.onConfirm();
        }
    };

    const handleSecondaryPress = () => {
        setAlertModal((prev) => ({ ...prev, visible: false }));
        if (alertModal.onCancel) {
            alertModal.onCancel();
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    };

    const handleSignOut = () => {
        showAlert(
            "Đăng xuất",
            "Bạn có chắc chắn muốn đăng xuất khỏi tài khoản này?",
            () => {
                logout();
                router.replace("/(auth)/sign-in");
            },
            "Đồng ý",
            "Bỏ qua"
        );
    };

    if (isLoading && !refreshing) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" color="#16A34A" />
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-100" edges={["top", "bottom"]}>
            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#16A34A"]} />
                }
            >
                {/* P1: User Identity Header */}
                <View className="px-4 py-6 flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                        <View className="relative">
                            <Image
                                source={{ uri: profile?.avatar || "https://avatar.iran.liara.run/public/boy" }}
                                className="w-20 h-20 rounded-full border-2 border-white shadow-sm bg-gray-100"
                            />
                            <TouchableOpacity
                                onPress={() => showAlert("Chỉnh sửa", "Tính năng đổi ảnh đang cập nhật")}
                                className="absolute bottom-0 right-0 bg-white p-1.5 rounded-full shadow-md border border-gray-100"
                            >
                                <Ionicons name="brush" size={12} color="#16A34A" />
                            </TouchableOpacity>
                        </View>
                        <View className="ml-4 flex-1">
                            <Text className="text-[20px] font-JakartaBold text-gray-700" numberOfLines={1}>
                                {profile?.name || "Người dùng BenGo"}
                            </Text>
                            <View className="flex-row items-center mt-1">
                                <View className="bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 flex-row items-center">
                                    <Ionicons name="ribbon" size={12} color="#D97706" />
                                    <Text className="ml-1 text-sm font-JakartaBold text-amber-600">
                                        Thành viên Vàng
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* P2: BenGo Wallet Card */}
                <View className="px-4 mb-8">
                    <LinearGradient
                        colors={["#0047AB", "#002B66"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        className="rounded-[24px] p-6 shadow-xl overflow-hidden"
                    >
                        <View className="flex-row justify-between items-start mb-4">
                            <View>
                                <Text className="text-white/70 text-sm font-JakartaMedium mb-1">Số dư ví BenGo</Text>
                                <Text className="text-white text-3xl font-JakartaBold">
                                    {(profile?.walletBalance || 0).toLocaleString("vi-VN")}
                                    <Text className="text-lg"> VND</Text>
                                </Text>
                            </View>
                            <View className="p-2 bg-white/10 rounded-xl">
                                <Ionicons name="card" size={24} color="white" />
                            </View>
                        </View>

                        <View className="flex-row justify-between items-center">
                            <View>
                                <Text className="text-white/50 text-sm font-JakartaMedium uppercase">
                                    Mã định danh ví
                                </Text>
                                <Text className="text-white/80 text-sm font-JakartaBold">
                                    **** **** **** {profile?.id?.slice(-4) || "8888"}
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => showAlert("Nạp tiền", "Tính năng nạp tiền qua cổng thanh toán đang được tích hợp.")}
                                className="bg-white px-4 py-2.5 rounded-full items-center justify-center flex-row shadow-lg"
                            >
                                <Ionicons name="add-circle" size={18} color="#0047AB" />
                                <Text className="ml-2 font-JakartaBold text-[#0047AB] text-sm">Nạp tiền</Text>
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>
                </View>

                {/* P3: Settings & Actions Menu List */}
                <View className="px-4 mb-4">
                    <Text className="text-lg font-JakartaBold text-gray-700 mb-4 px-2">Cài đặt tài khoản</Text>
                    <View className="bg-white rounded-2xl border border-neutral-50 shadow-sm p-2">
                        <MenuItem
                            icon="location"
                            label="Địa chỉ đã lưu"
                            onPress={() => router.push("/(root)/booking-setup")}
                        />
                        <MenuItem
                            icon="notifications"
                            label="Thông báo"
                            onPress={() => router.push("/(root)/tabs/notifications")}
                        />
                        <MenuItem
                            icon="shield-checkmark"
                            label="Bảo mật & Mật khẩu"
                            onPress={() => showAlert("Bảo mật", "Tính năng đổi mật khẩu đang cập nhật")}
                        />
                        <MenuItem
                            icon="help-circle-outline"
                            label="Hỗ trợ khách hàng"
                            onPress={() => Linking.openURL('tel:19001234')}
                        />
                    </View>
                </View>


                {/* P4: Logout Action */}
                <View className="px-4 pb-10 items-center">
                    <TouchableOpacity
                        onPress={handleSignOut}
                        className="w-[90%] flex-row items-center justify-center py-4 rounded-2xl border border-red-100 bg-red-50"
                    >
                        <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                        <Text className="ml-3 font-JakartaBold text-red-500 text-sm">Đăng xuất</Text>
                    </TouchableOpacity>
                    <Text className="mt-4 text-sm font-JakartaMedium text-neutral-400">Phiên bản 1.0.24 (Stable)</Text>
                </View>
            </ScrollView>

            <CustomModal
                visible={alertModal.visible}
                title={alertModal.title}
                message={alertModal.message}
                onClose={closeAlert}
                primaryButtonText={alertModal.primaryButtonText}
                secondaryButtonText={alertModal.secondaryButtonText}
                onSecondaryPress={handleSecondaryPress}
            />
        </SafeAreaView>
    );
};

export default CustomerProfileScreen;

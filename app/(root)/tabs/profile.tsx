import React, { useState } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import CustomModal from "@/components/Common/CustomModal";
import SupportContactModal from "@/components/Common/SupportContactModal";
import CustomButton from "@/components/Common/CustomButton";

const CustomerProfileScreen = () => {
    const { logout } = useAuth();
    const { data: profile, isLoading, error, refetch } = useProfile();
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

    const [supportModalVisible, setSupportModalVisible] = useState(false);
    const supportEmail = "hello@bengo.vn";
    const supportPhone = "19001234";
    const supportDescription = "Bạn có thể gọi hoặc gửi email bất cứ lúc nào, đội ngũ BenGo luôn sẵn sàng trợ giúp.";

    const openSupportModal = () => setSupportModalVisible(true);
    const closeSupportModal = () => setSupportModalVisible(false);

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
            "Đăng xuất",
            "Hủy"
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
                <View className="px-4 py-4 flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                        <View className="relative">
                            <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                                <Image
                                    source={{ uri: profile?.avatar || `https://api.dicebear.com/9.x/avataaars/png?seed=${profile?.name || 'Customer'}` }}
                                    className="w-full h-full"
                                />
                            </View>
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
                <View className="px-4 mb-4">
                <View
                    className="rounded-[24px] p-4 shadow-xl overflow-hidden"
                    style={{ backgroundColor: "#16A34A" }}
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
                                <Ionicons name="add-circle" size={18} color="#16A34A" />
                                <Text className="ml-2 font-JakartaBold text-[#16A34A] text-sm">Nạp tiền</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* P3: Action Menu List */}
                <View className="px-4">
                    <View className="bg-white rounded-3xl border border-gray-100 shadow-sm">
                        <MenuActionItem
                            icon="shield-checkmark-outline"
                            label="Bảo mật & Mật khẩu"
                            onPress={() => showAlert("Bảo mật", "Tính năng đổi mật khẩu đang cập nhật")}
                        />
                        <Divider />
                        <MenuActionItem
                            icon="help-buoy-outline"
                            label="Trung tâm hỗ trợ"
                            onPress={openSupportModal}
                        />
                        <Divider />
                        <MenuActionItem
                            icon="car-sport-outline"
                            label={profile?.role === 'DRIVER' ? "Hồ sơ tài xế" : "Đăng ký trở thành tài xế"}
                            status={profile?.status}
                            onPress={() => router.push("/(driver)/update-verification")}
                        />
                    </View>
                </View>

                {/* P4: Logout Section */}
                <View className="px-4 mt-4">
                    <CustomButton
                        title="Đăng xuất"
                        onPress={handleSignOut}
                        bgVariant="danger"
                        textVariant="danger"
                        IconRight={() => <Ionicons name="log-out-outline" size={24} color="#FFF" />}
                    />
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
            <SupportContactModal
                visible={supportModalVisible}
                onClose={closeSupportModal}
                email={supportEmail}
                phone={supportPhone}
                description={supportDescription}
            />
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
        <View className="bg-green-50 w-12 h-12 rounded-2xl items-center justify-center mr-3 border border-green-200">
            <Ionicons name={icon} size={22} color="#16A34A" />
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

export default CustomerProfileScreen;

import React, { useState, useRef } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, Linking, ActivityIndicator, Dimensions } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";

import { useOrderDetails, useCancelOrder } from "@/hooks/useOrders";
import VehicleBadge from "@/components/Common/VehicleBadge";
import CustomModal from "@/components/Common/CustomModal";
import CustomButton from "@/components/Common/CustomButton";
import StatusBadge from "@/components/Common/StatusBadge";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/hooks/useProfile";

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
    PENDING: { label: "Chờ xác nhận", color: "#D97706", bgColor: "#FEF3C7", icon: "time-outline" },
    ACCEPTED: { label: "Đã nhận đơn", color: "#2563EB", bgColor: "#DBEAFE", icon: "checkmark-circle-outline" },
    PICKED_UP: { label: "Đang giao hàng", color: "#4F46E5", bgColor: "#E0E7FF", icon: "car-outline" },
    DELIVERED: { label: "Đã hoàn thành", color: "#16A34A", bgColor: "#DCFCE7", icon: "checkbox-outline" },
    CANCELLED: { label: "Đã hủy", color: "#DC2626", bgColor: "#FEE2E2", icon: "close-circle-outline" },
};

const CustomerOrderDetailScreen = () => {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { user } = useAuth();
    const { data: profile, isLoading: profileLoading } = useProfile();
    const { data: order, isLoading } = useOrderDetails(id);

    const { mutateAsync: cancelOrder, isPending: isCancelling } = useCancelOrder();

    const mapRef = useRef<MapView>(null);

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

    if (isLoading) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" color="#16a34a" />
            </View>
        );
    }

    if (!order) {
        return (
            <View className="flex-1 justify-center items-center bg-white p-4">
                <Text className="text-lg font-JakartaBold text-gray-700">Không tìm thấy đơn hàng</Text>
                <TouchableOpacity onPress={() => router.back()} className="mt-4 bg-green-600 px-4 py-3 rounded-full">
                    <Text className="text-white font-JakartaBold">Quay lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const currentStatus = statusConfig[order.status] || statusConfig.PENDING;

    const handleCancel = () => {
        showAlert(
            "Xác nhận hủy đơn",
            "Bạn có chắc chắn muốn hủy đơn hàng này không?",
            async () => {
                try {
                    const res = await cancelOrder({ orderId: id, reason: "Người dùng yêu cầu hủy" });
                    showAlert("Thành công", "Đơn hàng của bạn đã được hủy.", () => router.back());
                } catch (error: any) {
                    showAlert("Lỗi", `Không thể hủy đơn hàng. Lỗi: ${error?.message || "Lỗi hệ thống"}`);
                }
            },
            "Đồng ý",
            "Bỏ qua"
        );
    };

    const handleCall = (phone: string) => {
        if (!phone) return;
        Linking.openURL(`tel:${phone}`);
    };

    const handleChat = (driverId: string) => {
        showAlert("Thông báo", "Tính năng Chat đang được phát triển.");
    };

    const handleReorder = () => {
        router.push("/(root)/booking-setup");
    };

    const handleRate = () => {
        router.push(`/(root)/payment/${id}`);
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-100" edges={["top", "bottom"]}>
            {/* Header */}
            <View className="flex-row items-center px-4 py-4 border-b border-gray-100 bg-white">
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color="black" />
                </TouchableOpacity>
                <Text className="flex-1 text-center font-JakartaBold text-lg text-gray-700">Chi tiết đơn hàng</Text>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                {/* CD2: Status Banner */}
                <View className="px-4 py-2" style={{ backgroundColor: currentStatus.bgColor }}>
                    <View className="flex-row justify-between items-center">
                        <View className="flex-row items-center">
                            <Ionicons name={currentStatus.icon} size={18} color={currentStatus.color} />
                            <Text className="ml-2 text-base font-JakartaSemiBold" style={{ color: currentStatus.color }}>
                                {currentStatus.label}
                            </Text>
                        </View>
                        <View className="items-end">
                            <Text className="text-lg font-JakartaMedium text-neutral-400">
                                #{id.slice(-8).toUpperCase()}
                            </Text>
                            <Text className="text-sm font-JakartaMedium text-neutral-400">
                                {new Date(order.createdAt).toLocaleString('vi-VN')}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* CD3: Route Map Summary */}
                <View style={{ height: Dimensions.get('window').height * 0.35, width: '100%' }}>
                    <MapView
                        ref={mapRef}
                        style={{ flex: 1 }}
                        initialRegion={{
                            latitude: (Number(order.pickup.lat) + Number(order.dropoff.lat)) / 2 || 10.762622,
                            longitude: (Number(order.pickup.lng) + Number(order.dropoff.lng)) / 2 || 106.660172,
                            latitudeDelta: Math.max(Math.abs(Number(order.pickup.lat) - Number(order.dropoff.lat)) * 2, 0.05),
                            longitudeDelta: Math.max(Math.abs(Number(order.pickup.lng) - Number(order.dropoff.lng)) * 2, 0.05),
                        }}
                        provider={PROVIDER_GOOGLE}
                    >
                        <Marker
                            coordinate={{ latitude: Number(order.pickup.lat), longitude: Number(order.pickup.lng) }}
                            title="Điểm lấy hàng"
                        >
                            <View className="bg-gray-100 p-1 rounded-full shadow-lg border-2 border-blue-500">
                                <Ionicons name="radio-button-on" size={20} color="#3B82F6" />
                            </View>
                        </Marker>
                        <Marker
                            coordinate={{ latitude: Number(order.dropoff.lat), longitude: Number(order.dropoff.lng) }}
                            title="Điểm giao hàng"
                        >
                            <View className="bg-gray-100 p-1 rounded-full shadow-lg border-2 border-red-500">
                                <Ionicons name="location" size={20} color="#EF4444" />
                            </View>
                        </Marker>
                        <MapViewDirections
                            origin={{ latitude: Number(order.pickup.lat), longitude: Number(order.pickup.lng) }}
                            destination={{ latitude: Number(order.dropoff.lat), longitude: Number(order.dropoff.lng) }}
                            apikey={process.env.EXPO_PUBLIC_GOOGLE_API_KEY || ""}
                            strokeWidth={3}
                            strokeColor="#16A34A"
                            onReady={(result) => {
                                mapRef.current?.fitToCoordinates(result.coordinates, {
                                    edgePadding: { right: 50, bottom: 50, left: 50, top: 50 },
                                    animated: true,
                                });
                            }}
                        />
                    </MapView>
                </View>

                <View
                    className="mx-4 mt-4 p-4 bg-white rounded-3xl border border-gray-100"
                    style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 1 }}
                >
                    <View className="flex-row items-center mb-4">
                        <View className="bg-green-600 w-7 h-7 rounded-full items-center justify-center mr-2 border border-green-200">
                            <Ionicons name="location" size={14} color="#ffffff" />
                        </View>
                        <Text className="text-lg font-JakartaBold text-green-600">Lộ trình vận chuyển</Text>
                    </View>

                    <View className="flex-row items-start">
                        <View className="items-center mr-4 pt-1.5">
                            <View className="w-5 h-5 rounded-full border-2 border-green-500 bg-white items-center justify-center">
                                <View className="w-2 h-2 rounded-full bg-green-500" />
                            </View>
                            <View className="w-[1px] h-16 bg-gray-200 my-1 border-dashed" />
                            <View className="w-5 h-5 rounded-full border-2 border-red-500 bg-white items-center justify-center">
                                <View className="w-2 h-2 rounded-full bg-red-500" />
                            </View>
                        </View>

                        <View className="flex-1">
                            <View className="mb-4">
                                <Text className="text-gray-500 font-JakartaBold text-sm uppercase mb-1">Điểm đón</Text>
                                <Text className="text-gray-700 font-JakartaBold" numberOfLines={2}>
                                    {order?.pickup?.address || "Không xác định"}
                                </Text>
                            </View>
                            <View>
                                <Text className="text-gray-500 font-JakartaBold text-sm uppercase mb-1">Điểm giao</Text>
                                <Text className="text-gray-700 font-JakartaBold" numberOfLines={2}>
                                    {order?.dropoff?.address || "Không xác định"}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View className="h-[1px] bg-gray-50 my-4" />

                    <View className="flex-row items-center justify-between">
                        <View>
                            <Text className="text-gray-500 font-JakartaBold text-sm uppercase mb-1">Phương tiện</Text>
                            <VehicleBadge vehicleType={order.vehicleType} />
                        </View>
                        <View className="items-end">
                            <Text className="text-gray-500 font-JakartaBold text-sm uppercase mb-1">Khoảng cách</Text>
                            <Text className="text-gray-700 font-JakartaBold text-base">{order.distanceKm} km</Text>
                        </View>
                    </View>
                </View>

                {/* Card 2: Chi tiết hàng hóa */}
                <View
                    className="mx-4 mt-4 p-4 bg-white rounded-3xl border border-gray-100"
                    style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}
                >
                    <View className="flex-row items-center mb-4">
                        <View className="bg-green-600 w-7 h-7 rounded-full items-center justify-center mr-2 border border-green-200">
                            <Ionicons name="cube" size={14} color="#ffffff" />
                        </View>
                        <Text className="text-lg font-JakartaBold text-green-600">Đặc điểm hàng hóa</Text>
                    </View>

                    <Text className="text-gray-500 font-JakartaBold text-sm uppercase mb-2">Hình ảnh</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                        {order.goodsImages && order.goodsImages.length > 0 ? (
                            order.goodsImages.map((img, index) => (
                                <Image
                                    key={index}
                                    source={{ uri: img }}
                                    className="w-32 h-32 rounded-2xl mr-3"
                                    resizeMode="cover"
                                />
                            ))
                        ) : (
                            <View className="w-32 h-32 rounded-2xl bg-gray-50 items-center justify-center border border-gray-100">
                                <Ionicons name="image-outline" size={32} color="#CBD5E1" />
                            </View>
                        )}
                    </ScrollView>

                    <Text className="text-gray-500 font-JakartaBold text-sm uppercase mb-1">Ghi chú từ khách hàng</Text>
                    <View className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <Text className="text-gray-700 font-JakartaMedium italic">
                            {order.specialNote || "Không có ghi chú thêm."}
                        </Text>
                    </View>
                </View>

                {/* Card 3: Thông tin các bên */}
                <View
                    className="mx-4 mt-4 p-4 bg-white rounded-3xl border border-gray-100"
                    style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}
                >
                    {/* Header: Contacts */}
                    <View className="flex-row items-center mb-4">
                        <View className="bg-green-600 w-7 h-7 rounded-full items-center justify-center mr-2 border border-green-200">
                            <Ionicons name="people" size={14} color="#ffffff" />
                        </View>
                        <Text className="text-lg font-JakartaBold text-green-600">Liên hệ liên quan</Text>
                    </View>

                    {/* Customer Row */}
                    {order.customer && (
                        <View className="flex-row items-center justify-between mb-4">
                            <View className="flex-row items-center flex-1">
                                <View className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center mr-3 overflow-hidden border border-gray-100">
                                    <Image
                                        source={{ uri: `https://api.dicebear.com/9.x/avataaars/png?seed=${order.customer?.name || 'Customer'}` }}
                                        className="w-full h-full"
                                    />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-sm text-gray-500 font-JakartaBold uppercase">Người gửi</Text>
                                    <Text className="text-base font-JakartaBold text-gray-700" numberOfLines={1}>{order.customer.name}</Text>
                                    <Text className="text-sm font-JakartaMedium text-gray-500">{order.customer.phone}</Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                onPress={() => handleCall(order.customer?.phone!)}
                                className="w-12 h-12 items-center justify-center bg-green-50 rounded-full border border-green-200"
                            >
                                <Ionicons name="call" size={20} color="#10B981" />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Driver Row (Conditional) */}
                    {(order.driver || order.driverId) ? (
                        <>
                            <View className="h-[1px] bg-gray-50 mb-4" />
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center flex-1">
                                    <View className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center mr-3 overflow-hidden border border-gray-100">
                                        <Image
                                            source={{ uri: order.driver?.avatar || order.driverId?.avatar || `https://api.dicebear.com/9.x/avataaars/png?seed=${order.driver?.name || order.driverId?.name || 'Driver'}` }}
                                            className="w-full h-full"
                                        />
                                    </View>
                                    <View className="flex-1">
                                        <View className="flex-row items-center justify-between pr-2">
                                            <Text className="text-sm text-gray-500 font-JakartaBold uppercase">Tài xế vận chuyển</Text>
                                        </View>
                                        <Text className="text-base font-JakartaBold text-gray-700" numberOfLines={1}>
                                            {order.driver?.name || order.driverId?.name}
                                        </Text>
                                        <Text className="text-sm font-JakartaMedium text-gray-500">
                                            {order.driver?.phone || order.driverId?.phone || "Đang lấy thông tin xe"}
                                        </Text>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    onPress={() => handleCall((order.driver?.phone || order.driverId?.phone)!)}
                                    className="w-12 h-12 items-center justify-center bg-green-50 rounded-full border border-green-200"
                                >
                                    <Ionicons name="call" size={20} color="#10B981" />
                                </TouchableOpacity>
                            </View>
                        </>
                    ) : (
                        <View className="mt-4 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex-row items-center">
                            <Ionicons name="hourglass-outline" size={20} color="#D97706" />
                            <Text className="ml-3 text-amber-700 font-JakartaMedium flex-1 text-sm">
                                Đang tìm tài xế phù hợp cho chuyến hàng của bạn...
                            </Text>
                        </View>
                    )}
                </View>

                {/* Card 4: Thông tin thanh toán */}
                <View
                    className="mx-4 mt-4 mb-4 p-4 bg-white rounded-3xl border border-gray-100"
                    style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}
                >
                    <View className="flex-row items-center mb-4">
                        <View className="bg-green-600 w-7 h-7 rounded-full items-center justify-center mr-2 border border-green-200">
                            <Ionicons name="receipt" size={12} color="#ffffff" />
                        </View>
                        <Text className="text-lg font-JakartaBold text-green-600">Thanh toán & Cước phí</Text>
                    </View>

                    <View className="space-y-3">
                        <View className="flex-row justify-between items-center">
                            <Text className="text-gray-500 font-JakartaMedium">Dịch vụ vận chuyển</Text>
                            <Text className="text-gray-700 font-JakartaBold">{order.totalPrice.toLocaleString("vi-VN")}đ</Text>
                        </View>
                        <View className="flex-row justify-between items-center">
                            <Text className="text-gray-500 font-JakartaMedium">Giảm giá</Text>
                            <Text className="text-green-600 font-JakartaBold">-0đ</Text>
                        </View>

                        <View className="h-[1px] bg-gray-50 my-1" />

                        <View className="flex-row justify-between items-center">
                            <Text className="text-gray-700 font-JakartaExtraBold text-lg">Tổng cộng</Text>
                            <Text className="text-2xl font-JakartaExtraBold text-green-600">
                                {order.totalPrice.toLocaleString("vi-VN")}đ
                            </Text>
                        </View>

                        <View className="h-[1px] bg-gray-50 my-1" />

                        <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center">
                                <View className="p-1.5 bg-gray-100 rounded-lg mr-2">
                                    <Ionicons
                                        name={order.paymentMethod === "CASH" ? "cash-outline" : "wallet-outline"}
                                        size={18}
                                        color="#4B5563"
                                    />
                                </View>
                                <Text className="text-gray-500 font-JakartaMedium text-sm">
                                    {order.paymentMethod === "CASH" ? "Tiền mặt" : "Ví BenGo"}
                                </Text>
                            </View>
                            <StatusBadge status={order.paymentStatus} />
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Action Buttons */}
            <View className="p-5 border-t border-gray-100 bg-white flex-row gap-3">
                {(order.status === "PENDING" || order.status === "ACCEPTED") && (
                    <CustomButton
                        title="Hủy đơn"
                        onPress={handleCancel}
                        bgVariant="red"
                        textVariant="red"
                        loading={isCancelling}
                        className="flex-1"
                    />
                )}

                {order.status === "DELIVERED" && (
                    <CustomButton
                        title="Đánh giá tài xế"
                        onPress={handleRate}
                        bgVariant="amber"
                        textVariant="amber"
                        className="flex-1"
                    />
                )}

                {(order.status === "DELIVERED" || order.status === "CANCELLED") && (
                    <CustomButton
                        title="Đặt lại chuyến"
                        onPress={handleReorder}
                        bgVariant="primary"
                        className="flex-1"
                    />
                )}

                {(order.status === "ACCEPTED" || order.status === "PICKED_UP") && (
                    <CustomButton
                        title="Theo dõi lộ trình"
                        onPress={() => router.push(`/(root)/track-order/${id}`)}
                        bgVariant="primary"
                        className="flex-1"
                    />
                )}
            </View>

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

export default CustomerOrderDetailScreen;

import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    ScrollView,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useOrderDetails, usePayOrder, useRateOrder } from "@/hooks/useOrders";
import { StarRating } from "@/components/Common/StarRating";
import CustomButton from "@/components/Common/CustomButton";
import CustomModal from "@/components/Common/CustomModal";

const PaymentScreen = () => {
    const { id } = useLocalSearchParams();
    const { data: order, isLoading: loading } = useOrderDetails(id as string);
    const [paymentMethod, setPaymentMethod] = useState<"CASH" | "WALLET">("CASH");
    const [isPaymentDone, setIsPaymentDone] = useState(false);

    // Rating state
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");

    const payMutation = usePayOrder();
    const rateMutation = useRateOrder();

    const isPaying = payMutation.isPending;
    const isSubmittingRating = rateMutation.isPending;

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

    useEffect(() => {
        if (order?.paymentStatus === "PAID") {
            setIsPaymentDone(true);
        }
    }, [order]);

    const handlePayment = async () => {
        try {
            await payMutation.mutateAsync({
                orderId: id as string,
                paymentMethod: paymentMethod,
            });
            showAlert("Thành công", "Thanh toán thành công!");
            setIsPaymentDone(true);
        } catch (error: any) {
            console.error("Payment Error:", error);
            showAlert("Lỗi", error.message || "Đã có lỗi xảy ra trong quá trình thanh toán.");
        }
    };

    const handleSubmitRating = async () => {
        try {
            await rateMutation.mutateAsync({
                orderId: id as string,
                rating: {
                    star: rating,
                    comment: comment,
                },
            });
            showAlert("Cảm ơn", "Đánh giá của bạn đã được gửi.", () => router.replace("/(root)/tabs/home"));
        } catch (error) {
            console.error("Rating Error:", error);
            showAlert("Lỗi", "Không thể gửi đánh giá lúc này.");
        }
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" color="#10B981" />
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-100" edges={["top", "bottom"]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1"
            >
                <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
                    {/* Header */}
                    <View className="py-6 items-center">
                        <Text className="text-2xl font-JakartaBold text-neutral-800">Hoàn tất dịch vụ</Text>
                        <Text className="text-neutral-500 font-JakartaMedium mt-1">Cảm ơn bạn đã sử dụng BenGo</Text>
                    </View>

                    {/* E1: Receipt Card */}
                    <View className="bg-green-50 rounded-3xl p-6 items-center mb-8 border border-green-100">
                        <View className="w-16 h-16 bg-white rounded-full items-center justify-center mb-4 shadow-sm">
                            <Ionicons name="card" size={32} color="#10B981" />
                        </View>
                        <Text className="text-neutral-500 font-JakartaMedium">Tổng cộng phải thanh toán</Text>
                        <Text className="text-4xl font-JakartaExtraBold text-green-600 mt-2">
                            {(order?.totalPrice || 0).toLocaleString("vi-VN")} VND
                        </Text>
                        <View className="w-full border-t border-green-200 border-dashed mt-4 pt-4">
                            <View className="flex-row justify-between mb-2">
                                <Text className="text-neutral-500 font-JakartaMedium">Mã đơn hàng</Text>
                                <Text className="font-JakartaSemiBold">#{id?.toString().slice(-8).toUpperCase()}</Text>
                            </View>
                            <View className="flex-row justify-between">
                                <Text className="text-neutral-500 font-JakartaMedium">Khoảng cách</Text>
                                <Text className="font-JakartaSemiBold">{order?.distanceKm} km</Text>
                            </View>
                        </View>
                    </View>

                    {!isPaymentDone ? (
                        <>
                            {/* E2: Payment Selector */}
                            <Text className="text-lg font-JakartaBold mb-4">Phương thức thanh toán</Text>
                            <TouchableOpacity
                                onPress={() => setPaymentMethod("CASH")}
                                className={`flex-row items-center p-4 rounded-2xl mb-4 border-2 ${paymentMethod === "CASH" ? "border-green-500 bg-green-50" : "border-gray-100"}`}
                            >
                                <View className={`w-10 h-10 rounded-full items-center justify-center ${paymentMethod === "CASH" ? "bg-green-500" : "bg-gray-100"}`}>
                                    <Ionicons name="cash" size={20} color={paymentMethod === "CASH" ? "white" : "#9CA3AF"} />
                                </View>
                                <Text className={`ml-4 flex-1 font-JakartaBold ${paymentMethod === "CASH" ? "text-green-600" : "text-neutral-500"}`}>Tiền mặt</Text>
                                {paymentMethod === "CASH" && <Ionicons name="checkmark-circle" size={24} color="#10B981" />}
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => setPaymentMethod("WALLET")}
                                className={`flex-row items-center p-4 rounded-2xl mb-8 border-2 ${paymentMethod === "WALLET" ? "border-green-500 bg-green-50" : "border-gray-100"}`}
                            >
                                <View className={`w-10 h-10 rounded-full items-center justify-center ${paymentMethod === "WALLET" ? "bg-green-500" : "bg-gray-100"}`}>
                                    <Ionicons name="wallet" size={20} color={paymentMethod === "WALLET" ? "white" : "#9CA3AF"} />
                                </View>
                                <View className="ml-4 flex-1">
                                    <Text className={`font-JakartaBold ${paymentMethod === "WALLET" ? "text-green-600" : "text-neutral-500"}`}>Ví BenGo</Text>
                                    <Text className="text-sm text-neutral-400">Thanh toán nhanh & an toàn</Text>
                                </View>
                                {paymentMethod === "WALLET" && <Ionicons name="checkmark-circle" size={24} color="#10B981" />}
                            </TouchableOpacity>

                            <CustomButton
                                title={isPaying ? "Đang xử lý..." : "Thanh toán ngay"}
                                onPress={handlePayment}
                                disabled={isPaying}
                                className="mb-10"
                            />
                        </>
                    ) : (
                        <>
                            {/* E3: Rating & Review Form */}
                            <View className="items-center">
                                <Text className="text-lg font-JakartaBold mb-2">Đánh giá tài xế</Text>
                                <Text className="text-neutral-400 text-center mb-4">Trải nghiệm của bạn với tài xế {order?.driverId?.name} thế nào?</Text>

                                <StarRating
                                    rating={rating}
                                    onRatingChange={setRating}
                                    size={40}
                                />

                                <TextInput
                                    placeholder="Nhận xét của bạn (không bắt buộc)"
                                    value={comment}
                                    onChangeText={setComment}
                                    multiline
                                    numberOfLines={4}
                                    className="w-full bg-neutral-50 mt-8 p-4 rounded-2xl border border-gray-100 text-neutral-800 font-JakartaMedium h-32"
                                    textAlignVertical="top"
                                />

                                <CustomButton
                                    title={isSubmittingRating ? "Đang gửi..." : "Gửi đánh giá"}
                                    onPress={handleSubmitRating}
                                    disabled={isSubmittingRating}
                                    className="w-full mt-8 mb-10"
                                />
                            </View>
                        </>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>

            <CustomModal
                visible={alertModal.visible}
                title={alertModal.title}
                message={alertModal.message}
                onClose={closeAlert}
            />
        </SafeAreaView>
    );
};

export default PaymentScreen;

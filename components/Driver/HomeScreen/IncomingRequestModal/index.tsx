import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Animated, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PendingOrder } from '@/api/driver';
import CustomButton from '@/components/Common/CustomButton';
import CustomModal from '@/components/Common/CustomModal';
import VehicleBadge from '@/components/Common/VehicleBadge';

interface Props {
  visible: boolean;
  order: PendingOrder | null;
  onAccept: (orderId: string) => void;
  onDecline: () => void;
  onTimeout: () => void;
  isAccepting: boolean;
  isOnline?: boolean;
}

const IncomingRequestModal = ({ visible, order, onAccept, onDecline, onTimeout, isAccepting, isOnline = true }: Props) => {
  const [timeLeft, setTimeLeft] = useState(30);
  const [showWarning, setShowWarning] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && order) {
      setTimeLeft(30);
      progressAnim.setValue(0);

      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 30000,
        useNativeDriver: false,
      }).start();

      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            onTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        clearInterval(timer);
        progressAnim.stopAnimation();
      };
    }
  }, [visible, order]);

  if (!order) return null;

  const formatCurrency = (amount: number) => amount.toLocaleString('vi-VN') + ' ₫';

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 justify-center items-center bg-black/70 px-4">
        <View className="bg-white w-full rounded-[32px] overflow-hidden shadow-2xl">
          {/* Header */}
          <View className="bg-green-50 w-full py-4 items-center border-b border-green-100 flex-row justify-between px-4">
            <View className="w-8" />
            <View className="flex-row items-center">
              <Ionicons name="flash" size={24} color="#10B981" />
              <Text className="text-green-700 font-JakartaBold text-lg ml-2 uppercase">Yêu cầu mới!</Text>
            </View>
            <TouchableOpacity onPress={onDecline} disabled={isAccepting} className="w-8 items-end">
              <Ionicons name="close" size={28} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <View className="p-6">
            <View className="items-center mb-4">
              <Text className="text-gray-500 font-JakartaMedium text-sm mb-1 uppercase">Giá trị chuyến đi</Text>
              <Text className="text-green-600 text-[42px] font-JakartaExtraBold">{formatCurrency(order.price)}</Text>
              <View className="flex-row justify-center items-center mt-2 gap-2">
                <VehicleBadge vehicleType={(order as any).vehicleType || "UNKNOWN"} />
                <View className="flex-row items-center px-3 py-1 rounded-full border bg-gray-100 border-gray-200">
                  <Ionicons name="navigate-outline" size={14} color="#374151" />
                  <Text className="ml-1.5 font-JakartaBold text-sm text-gray-700">
                    {order.distance} km
                  </Text>
                </View>
              </View>
            </View>

            {/* Body: Timeline */}
            <View className="mb-4 px-1 mt-2">
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
                    <Text className="text-gray-500 font-JakartaBold text-sm uppercase mb-1">
                      Điểm đón
                    </Text>
                    <Text
                      className="text-gray-700 font-JakartaBold"
                      numberOfLines={2}
                    >
                      {(order as any).pickupAddress || order.pickup?.address || "Không xác định"}
                    </Text>
                  </View>
                  <View>
                    <Text className="text-gray-500 font-JakartaBold text-sm uppercase mb-1">
                      Điểm giao
                    </Text>
                    <Text
                      className="text-gray-700 font-JakartaBold"
                      numberOfLines={2}
                    >
                      {(order as any).dropoffAddress || order.destination?.address || "Không xác định"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Footer & Buttons */}
          <View className="pt-2 pb-6 px-4">
            <CustomButton
              title="Nhận chuyến"
              onPress={() => {
                if (!isOnline) {
                  setShowWarning(true);
                  return;
                }
                onAccept(order.orderId);
              }}
              disabled={isAccepting}
              loading={isAccepting}
              IconRight={() => !isAccepting ? (
                <View className="ml-2 bg-white/20 px-2 py-0.5 rounded-full">
                  <Text className="text-white font-JakartaBold text-sm">{timeLeft}s</Text>
                </View>
              ) : <></>}
            />

            <TouchableOpacity onPress={onDecline} disabled={isAccepting} className="mt-4 items-center">
              <Text className="text-gray-500 font-JakartaSemiBold text-base">Bỏ qua chuyến này</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <CustomModal
        visible={showWarning}
        title="Lưu ý"
        message="Bạn cần gạt công tắc Trực tuyến (ở trên cùng màn hình) để có thể nhận chuyến này."
        onClose={() => setShowWarning(false)}
      />
    </Modal>
  );
};

export default IncomingRequestModal;

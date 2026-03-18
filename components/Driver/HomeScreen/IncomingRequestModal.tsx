import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PendingOrder } from '@/api/driver';

interface Props {
  visible: boolean;
  order: PendingOrder | null;
  onAccept: (orderId: string) => void;
  onDecline: () => void;
  onTimeout: () => void;
  isAccepting: boolean;
}

const IncomingRequestModal = ({ visible, order, onAccept, onDecline, onTimeout, isAccepting }: Props) => {
  const [timeLeft, setTimeLeft] = useState(30);
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
          <View className="bg-green-50 w-full py-4 items-center border-b border-green-100 flex-row justify-between px-6">
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
            <View className="items-center mb-6">
              <Text className="text-gray-500 font-JakartaMedium text-sm mb-1 uppercase tracking-wider">Giá trị chuyến đi</Text>
              <Text className="text-green-600 text-[42px] font-JakartaExtraBold">{formatCurrency(order.price)}</Text>
              <View className="flex-row items-center mt-2 bg-gray-100 px-3 py-1.5 rounded-full">
                <Ionicons name="car-outline" size={16} color="#4B5563" />
                <Text className="text-gray-700 font-JakartaSemiBold text-sm ml-2 mr-4">BenGo Car</Text>
                <Ionicons name="navigate-outline" size={16} color="#4B5563" />
                <Text className="text-gray-700 font-JakartaSemiBold text-sm ml-2">{order.distance} km</Text>
              </View>
            </View>

            {/* Timeline */}
            <View className="pl-2">
              <View className="flex-row items-start mb-4 relative">
                <View className="w-6 h-6 rounded-full bg-blue-100 items-center justify-center z-10 mr-3">
                  <View className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                </View>
                <View className="absolute left-[11px] top-6 w-0.5 h-10 bg-gray-200" />
                <View className="flex-1 pt-0.5">
                  <Text className="text-gray-500 font-Jakarta text-xs mb-0.5">ĐIỂM ĐÓN</Text>
                  <Text className="text-gray-900 font-JakartaSemiBold text-base" numberOfLines={2}>
                    {order.pickup?.address || 'Địa chỉ đón khách'}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-start">
                <View className="w-6 h-6 rounded-full bg-red-100 items-center justify-center z-10 mr-3">
                  <Ionicons name="location" size={14} color="#DC2626" />
                </View>
                <View className="flex-1 pt-0.5">
                  <Text className="text-gray-500 font-Jakarta text-xs mb-0.5">ĐIỂM ĐẾN</Text>
                  <Text className="text-gray-900 font-JakartaSemiBold text-base" numberOfLines={2}>
                    {order.destination?.address || 'Địa chỉ trả khách'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Footer & Buttons */}
          <View className="pt-2 pb-6 px-6">
            <TouchableOpacity
              onPress={() => onAccept(order.orderId)}
              disabled={isAccepting}
              className={`w-full py-4 rounded-2xl items-center justify-center flex-row ${isAccepting ? 'bg-green-400' : 'bg-green-600'}`}
              style={{ shadowColor: '#16A34A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 }}
            >
              <Text className="text-white font-JakartaBold text-xl uppercase tracking-wider">CHẤP NHẬN</Text>
              {!isAccepting && (
                <View className="ml-2 bg-white/20 px-2 py-0.5 rounded-full">
                  <Text className="text-white font-JakartaBold text-sm">{timeLeft}s</Text>
                </View>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity onPress={onDecline} disabled={isAccepting} className="mt-4 items-center">
              <Text className="text-gray-400 font-JakartaSemiBold text-base">Bỏ qua chuyến này</Text>
            </TouchableOpacity>
          </View>

          {/* Progress Bar Container */}
          <View className="h-1.5 w-full bg-gray-100 absolute bottom-0">
            <Animated.View 
              className="h-full bg-green-500" 
              style={{
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['100%', '0%']
                })
              }} 
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default IncomingRequestModal;

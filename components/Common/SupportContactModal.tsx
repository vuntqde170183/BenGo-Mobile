import React from "react";
import { Modal, View, Text, TouchableOpacity, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CustomButton from "@/components/Common/CustomButton";

export interface SupportContactModalProps {
  visible: boolean;
  onClose: () => void;
  email?: string;
  phone?: string;
  description?: string;
}

const SupportContactModal = ({
  visible,
  onClose,
  email = "hello@bengo.vn",
  phone = "19001234",
  description = "Gặp vấn đề gì? Chúng tôi luôn sẵn sàng trợ giúp bạn xuyên suốt hành trình."
}: SupportContactModalProps) => {
  const handleEmailPress = () => {
    Linking.openURL(`mailto:${email}`);
  };

  const handlePhonePress = () => {
    Linking.openURL(`tel:${phone}`);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/40 justify-center items-center px-6">
        <View className="bg-white rounded-3xl w-full p-6 shadow-xl">
          <View className="items-center mb-4">
            <View className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-2">
              <Ionicons name="help-circle-outline" size={32} color="#2563EB" />
            </View>
            <Text className="text-xl font-JakartaExtraBold text-gray-900">Trung tâm hỗ trợ</Text>
            <Text className="text-center text-gray-500 font-Jakarta text-sm mt-1">
              {description}
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleEmailPress}
            className="flex-row items-center justify-between border border-gray-100 rounded-2xl px-4 py-3 mb-3"
          >
            <View className="flex-row items-center gap-3">
              <View className="w-12 h-12 items-center justify-center bg-green-50 rounded-full">
                <Ionicons name="mail-open-outline" size={20} color="#10B981" />
              </View>
              <View>
                <Text className="font-JakartaBold text-gray-700 text-base">Email hỗ trợ</Text>
                <Text className="text-sm text-gray-500">{email}</Text>
              </View>
            </View>
            <View className="w-12 h-12 items-center justify-center bg-green-50 rounded-full">
              <Ionicons name="open-outline" size={20} color="#10B981" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handlePhonePress}
            className="flex-row items-center justify-between border border-gray-100 rounded-2xl px-4 py-3 mb-4"
          >
            <View className="flex-row items-center gap-3">
              <View className="w-12 h-12 items-center justify-center bg-green-50 rounded-full">
                <Ionicons name="call-outline" size={20} color="#10B981" />
              </View>
              <View>
                <Text className="font-JakartaBold text-gray-700 text-base">Tổng đài hỗ trợ</Text>
                <Text className="text-sm text-gray-500">{phone}</Text>
              </View>
            </View>
            <View className="w-12 h-12 items-center justify-center bg-green-50 rounded-full">
              <Ionicons name="call-sharp" size={20} color="#10B981" />
            </View>
          </TouchableOpacity>

          <CustomButton title="Đóng" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
};

export default SupportContactModal;

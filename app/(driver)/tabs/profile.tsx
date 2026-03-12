import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const ProfileScreen = () => {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-5 pt-4">
        <Text className="text-2xl font-JakartaBold text-gray-900">Tài khoản</Text>
        
        <View className="mt-8 items-center">
          <View className="w-24 h-24 bg-gray-100 rounded-full items-center justify-center border-4 border-gray-50">
             <Ionicons name="person" size={48} color="#94a3b8" />
          </View>
          <Text className="text-xl font-JakartaBold text-gray-900 mt-4">{user?.name || 'Tài xế BenGo'}</Text>
          <Text className="text-gray-500 font-Jakarta mt-1">ID: #{user?.id?.slice(-8) || 'N/A'}</Text>
        </View>

        <View className="mt-10 space-y-4">
           {/* Profile menu items */}
           <TouchableOpacity className="flex-row items-center p-4 bg-gray-50 rounded-2xl mb-3">
              <View className="w-10 h-10 bg-white items-center justify-center rounded-xl mr-4 shadow-sm">
                 <Ionicons name="person-outline" size={20} color="#22C55E" />
              </View>
              <Text className="flex-1 font-JakartaMedium text-gray-700">Thông tin cá nhân</Text>
              <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
           </TouchableOpacity>

           <TouchableOpacity className="flex-row items-center p-4 bg-gray-50 rounded-2xl mb-3">
              <View className="w-10 h-10 bg-white items-center justify-center rounded-xl mr-4 shadow-sm">
                 <Ionicons name="car-outline" size={20} color="#22C55E" />
              </View>
              <Text className="flex-1 font-JakartaMedium text-gray-700">Thông tin xe</Text>
              <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
           </TouchableOpacity>

           <TouchableOpacity className="flex-row items-center p-4 bg-gray-50 rounded-2xl mb-3">
              <View className="w-10 h-10 bg-white items-center justify-center rounded-xl mr-4 shadow-sm">
                 <Ionicons name="settings-outline" size={20} color="#22C55E" />
              </View>
              <Text className="flex-1 font-JakartaMedium text-gray-700">Cài đặt</Text>
              <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
           </TouchableOpacity>

           <TouchableOpacity 
             onPress={logout}
             className="flex-row items-center p-4 bg-red-50 rounded-2xl mt-4"
           >
              <View className="w-10 h-10 bg-white items-center justify-center rounded-xl mr-4 shadow-sm">
                 <Ionicons name="log-out-outline" size={20} color="#EF4444" />
              </View>
              <Text className="flex-1 font-JakartaMedium text-red-600">Đăng xuất</Text>
           </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;

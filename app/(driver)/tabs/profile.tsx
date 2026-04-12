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
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useDriverDocuments, useDriverToggleStatus } from "@/hooks/useDriver";
import { useUpload } from "@/hooks/useUpload";
import * as ImagePicker from "expo-image-picker";
import CustomButton from "@/components/Common/CustomButton";
import CustomModal from "@/components/Common/CustomModal";
import InputField from "@/components/Common/InputField";
import StatusBadge from "@/components/Common/StatusBadge";
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { useState, useEffect, useCallback, useRef } from "react";
import { fetchAPI } from "@/lib/fetch";

const ProfileScreen = () => {
  const { user, logout, token } = useAuth();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const bottomSheetRef = useRef<BottomSheet>(null);

  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    avatar: "",
  });

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

  const {
    data: profileData,
    isLoading: profileLoading,
    refetch: refetchProfile
  } = useProfile();

  const { mutate: updateProfile, isPending: updating } = useUpdateProfile();
  const { uploadImage, isUploading } = useUpload();
  const [isUploadingLocal, setIsUploadingLocal] = useState(false);

  useEffect(() => {
    if (profileData) {
      setEditForm({
        name: profileData.name || "",
        phone: profileData.phone || "",
        avatar: profileData.avatar || "",
      });
    }
  }, [profileData]);

  const effectiveUserId = user?._id || user?.id || profileData?._id || profileData?.id || null;

  const {
    data: documentData,
    isLoading: docLoading,
    refetch: refetchDocs
  } = useDriverDocuments(effectiveUserId);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchProfile(), refetchDocs()]);
    setRefreshing(false);
  }, [refetchProfile, refetchDocs]);

  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAlert("Lỗi", "Cần quyền truy cập ảnh để đổi ảnh đại diện!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      const selectedUri = result.assets[0].uri;
      setIsUploadingLocal(true);

      try {
        const res = await uploadImage(selectedUri);
        if (res?.url) {
          setEditForm(prev => ({ ...prev, avatar: res.url }));
        }
      } catch (err) {
        showAlert("Lỗi", "Không thể tải ảnh lên. Vui lòng thử lại!");
      } finally {
        setIsUploadingLocal(false);
      }
    }
  };

  const handleUpdateProfile = () => {
    if (!editForm.name || !editForm.phone) {
      showAlert("Lỗi", "Vui lòng nhập đầy đủ họ tên và số điện thoại");
      return;
    }

    updateProfile(editForm, {
      onSuccess: () => {
        bottomSheetRef.current?.close();
        showAlert("Thành công", "Cập nhật hồ sơ thành công");
      },
      onError: (error: any) => {
        showAlert("Lỗi", error.message || "Cập nhật hồ sơ thất bại");
      }
    });
  };

  const handleLogout = () => {
    showAlert(
      "Đăng xuất",
      "Bạn có chắc chắn muốn đăng xuất khỏi tài khoản?",
      async () => {
        try {
          await fetchAPI("/(api)/driver/status", {
            method: "PUT",
            body: JSON.stringify({
              isOnline: false,
              location: { lat: 0, lng: 0 }
            }),
          });
          logout();
          router.replace("/(auth)/sign-in");
        } catch (error) {
          logout();
          router.replace("/(auth)/sign-in");
        }
      },
      "Đăng xuất",
      "Hủy"
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
              <View className="w-[100px] h-[100px] rounded-full bg-gray-100 p-1 shadow-lg items-center justify-center overflow-hidden border-2 border-white">
                <Image
                  source={{ uri: profileData?.avatar || `https://api.dicebear.com/9.x/avataaars/png?seed=${user?.name || 'Driver'}` }}
                  className="w-full h-full rounded-full"
                />
              </View>
            </View>

            <Text className="text-xl font-JakartaBold text-gray-700 mt-4">
              {user?.name || "Tài xế BenGo"}
            </Text>

            <View className="flex-row items-center mt-2 gap-2">
              <View className="flex-row items-center px-3 py-1 bg-green-100 rounded-full border border-green-200">
                <Ionicons name="star" size={14} color="#EAB308" />
                <Text className="text-amber-400 font-JakartaBold ml-1 text-sm">
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
              <Text className="text-gray-700 font-JakartaBold mt-1">{driverStats.totalTrips || 0}</Text>
            </View>

            <View className="w-[1px] h-10 bg-gray-100" />

            <View className="flex-1 items-center">
              <Ionicons name="checkmark-circle-outline" size={24} color="#10B981" />
              <Text className="text-gray-500 text-sm mt-1 font-Jakarta">Tỷ lệ nhận</Text>
              <Text className="text-gray-700 font-JakartaBold mt-1">{driverStats.acceptanceRate || 0}%</Text>
            </View>

            <View className="w-[1px] h-10 bg-gray-100" />

            <View className="flex-1 items-center">
              <Ionicons name="time-outline" size={24} color="#F59E0B" />
              <Text className="text-gray-500 text-sm mt-1 font-Jakarta">Thâm niên</Text>
              <Text className="text-gray-700 font-JakartaBold mt-1">{driverStats.seniority || "New"}</Text>
            </View>
          </View>

          {/* P3: Action Menu List */}
          <View className="mt-4 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <MenuActionItem
              icon="person-circle-outline"
              label="Chỉnh sửa hồ sơ"
              onPress={() => bottomSheetRef.current?.expand()}
            />
            <Divider />
            <MenuActionItem
              icon="document-attach-outline"
              label="Quản lý giấy tờ"
              status={documentData?.data?.driverProfile?.status || profileData?.status}
              onPress={() => router.push("/(driver)/documents")}
            />
            <Divider />
            <MenuActionItem
              icon="settings-outline"
              label="Cài đặt ứng dụng"
              onPress={() => showAlert("Thông báo", "Chuyển đến màn hình Cài đặt")}
            />
            <Divider />
            <MenuActionItem
              icon="help-buoy-outline"
              label="Trung tâm hỗ trợ"
              onPress={() => showAlert("Thông báo", "Chuyển đến Trung tâm hỗ trợ")}
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

      <CustomModal
        visible={alertModal.visible}
        title={alertModal.title}
        message={alertModal.message}
        onClose={closeAlert}
        primaryButtonText={alertModal.primaryButtonText}
        secondaryButtonText={alertModal.secondaryButtonText}
        onSecondaryPress={handleSecondaryPress}
      />

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={["60%"]}
        enablePanDownToClose
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
        )}
        handleIndicatorStyle={{ backgroundColor: "#E5E7EB", width: 40 }}
        backgroundStyle={{ borderRadius: 32, backgroundColor: 'white' }}
      >
        <BottomSheetView className="px-4 pb-6">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-2xl font-JakartaExtraBold text-gray-800">Chỉnh sửa hồ sơ</Text>
            <TouchableOpacity
              onPress={() => bottomSheetRef.current?.close()}
              className="bg-gray-100 p-2 rounded-full"
            >
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View className="space-y-4">
            <View className="items-center">
              <TouchableOpacity onPress={handlePickAvatar} className="relative">
                <View className="w-28 h-28 rounded-full bg-gray-100 border-4 border-white shadow-md overflow-hidden items-center justify-center">
                  {isUploadingLocal || isUploading ? (
                    <ActivityIndicator color="#10B981" />
                  ) : (
                    <Image
                      source={{ uri: editForm.avatar || `https://api.dicebear.com/9.x/avataaars/png?seed=${editForm.name}` }}
                      className="w-full h-full"
                    />
                  )}
                </View>
                <View className="absolute bottom-0 right-0 bg-green-600 p-2 rounded-full border-2 border-white shadow-sm">
                  <Ionicons name="camera" size={16} color="white" />
                </View>
              </TouchableOpacity>
              <Text className="text-gray-500 text-base mt-2 font-JakartaMedium">Nhấn để thay đổi ảnh</Text>
            </View>

            <InputField
              label="Họ và tên"
              placeholder="Nhập họ tên của bạn"
              icon="person-outline"
              value={editForm.name}
              onChangeText={(value) => setEditForm(prev => ({ ...prev, name: value }))}
            />

            <InputField
              label="Số điện thoại"
              placeholder="Nhập số điện thoại"
              icon="call-outline"
              value={editForm.phone}
              keyboardType="phone-pad"
              onChangeText={(value) => setEditForm(prev => ({ ...prev, phone: value }))}
            />

            <View className="mt-4 flex-row gap-4">
              <View className="flex-1">
                <CustomButton
                  title="Hủy"
                  onPress={() => bottomSheetRef.current?.close()}
                  bgVariant="outline"
                  textVariant="primary"
                  IconLeft={() => <Ionicons name="close-outline" size={20} color="#10B981" />}
                />
              </View>
              <View className="flex-1">
                <CustomButton
                  title="Lưu"
                  onPress={handleUpdateProfile}
                  loading={updating}
                  IconLeft={() => <Ionicons name="checkmark-outline" size={20} color="white" />}
                />
              </View>
            </View>
          </View>
        </BottomSheetView>
      </BottomSheet>
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
      <Ionicons name={icon} size={22} color="#10B981" />
    </View>
    <View className="flex-1 flex-row items-center justify-between">
      <Text className="font-JakartaBold text-gray-700 text-base">{label}</Text>
      <View className="flex-row items-center">
        {status && (
          <View className="mr-2">
            <StatusBadge status={status} />
          </View>
        )}
        <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
      </View>
    </View>
  </TouchableOpacity>
);

const Divider = () => <View className="h-[1px] bg-gray-50 mx-4" />;

export default ProfileScreen;

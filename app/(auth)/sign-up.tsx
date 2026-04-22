import CustomButton from "@/components/Common/CustomButton";
import CustomModal from "@/components/Common/CustomModal";
import InputField from "@/components/Common/InputField";
import { icons, images } from "@/constants";
import { Link, router } from "expo-router";
import { useState } from "react";
import {
  Image,
  Modal,
  ScrollView,
  Text,
  View,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useRegister } from "@/hooks/useAuthActions";
import { useAuth } from "@/context/AuthContext";

const SignUp = () => {
  const { t } = useTranslation();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const { setAuth } = useAuth();
  const { mutate: register, isPending: loading } = useRegister();
  const [localOtp, setLocalOtp] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });

  const [verificationModal, setVerificationModal] = useState({
    visible: false,
    otp: "",
  });

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

  const onSignUpPress = async () => {
    if (!form.name || !form.phone || !form.password || !form.email) {
      showAlert(t("common.error"), "Vui lòng nhập đầy đủ Tên, Số điện thoại, Email và Mật khẩu");
      return;
    }

    setIsSendingEmail(true);
    const newOtp = Math.floor(1000 + Math.random() * 9000).toString();
    setLocalOtp(newOtp);

    try {
      const response = await fetch("/(api)/email/send-verification", {
        method: "POST",
        body: JSON.stringify({
          email: form.email,
          name: form.name,
          otp: newOtp,
        }),
      });

      const result = await response.json();
      setIsSendingEmail(false);

      if (result.success) {
        setVerificationModal({ ...verificationModal, visible: true });
      } else {
        showAlert(t("common.error"), result.error || "Không thể gửi email xác thực. Vui lòng kiểm tra lại email hoặc thử lại sau.");
      }
    } catch (error) {
      setIsSendingEmail(false);
      showAlert(t("common.error"), "Lỗi hệ thống khi gửi email.");
    }
  };

  const onVerifyPress = async () => {
    if (verificationModal.otp !== localOtp) {
      showAlert(t("common.error"), "Mã xác thực không chính xác");
      return;
    }

    register({
      name: form.name,
      phone: form.phone,
      email: form.email,
      password: form.password,
      type: "CUSTOMER"
    }, {
      onSuccess: (res: any) => {
        const registrationData = res.data || res;
        if (registrationData && registrationData.accessToken && registrationData.user) {
          setAuth(registrationData.accessToken, registrationData.user);
          setVerificationModal({ ...verificationModal, visible: false });
          setShowSuccessModal(true);
        } else {
          setVerificationModal({ ...verificationModal, visible: false });
          setShowSuccessModal(true);
        }
      },
      onError: (err: any) => {
        let errorMsg = err.message || "Đăng ký thất bại sau xác thực. Vui lòng thử lại sau.";

        if (errorMsg.includes(" - {")) {
          try {
            const jsonPart = errorMsg.substring(errorMsg.indexOf(" - ") + 3);
            const errorData = JSON.parse(jsonPart);
            if (errorData.message) {
              errorMsg = errorData.message;
            }
          } catch (e) {
          }
        }

        showAlert(t("common.error"), errorMsg);
      }
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            className="px-4 pb-5"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Logo */}
            <View className="items-center mb-4">
              <Image
                source={images.signUpCar}
                className="h-60 w-auto"
                resizeMode="contain"
              />
            </View>

            {/* Title Text */}
            <View className="items-center mb-4">
              <Text className="text-2xl text-gray-700 font-JakartaBold mb-2">
                Tạo tài khoản
              </Text>
              <Text className="text-base text-gray-500 font-JakartaMedium">
                Đăng ký tài khoản để bắt đầu cùng BenGo
              </Text>
            </View>

            {/* Form */}
            <View className="flex-1">
              <InputField
                label={t("profile.name")}
                placeholder={t("profile.name")}
                icon="person-outline"
                value={form.name}
                onChangeText={(value) => setForm({ ...form, name: value })}
              />

              <InputField
                label={t("profile.phone") || "Phone"}
                placeholder={t("profile.phone") || "0123456789"}
                icon="call-outline"
                value={form.phone}
                keyboardType="phone-pad"
                onChangeText={(value) => setForm({ ...form, phone: value })}
              />

              <InputField
                label={t("auth.email")}
                placeholder={t("auth.email")}
                icon="mail-outline"
                value={form.email}
                onChangeText={(value) => setForm({ ...form, email: value })}
              />

              <InputField
                label={t("auth.password")}
                placeholder={t("auth.password")}
                icon="lock-closed-outline"
                secureTextEntry={true}
                value={form.password}
                onChangeText={(value) =>
                  setForm({ ...form, password: value })
                }
              />

              <CustomButton
                title={t("auth.signUp")}
                onPress={onSignUpPress}
                loading={loading || isSendingEmail}
                IconLeft={() => <Ionicons name="person-add-outline" size={20} color="white" />}
                className="mt-4"
              />
              <View className="flex-row justify-center items-center mt-4 mb-4">
                <Text className="text-gray-500 font-JakartaMedium">
                  {t("auth.alreadyHaveAccount")}{" "}
                </Text>
                <Link href="/(auth)/sign-in">
                  <Text className="text-green-600 font-JakartaBold">
                    {t("auth.signIn")}
                  </Text>
                </Link>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* Modal for Success */}
      <Modal
        visible={showSuccessModal}
        transparent animationType="fade"
      >
        <View
          className="flex-1 justify-center items-center px-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <View className="bg-white w-full px-7 py-9 rounded-2xl min-h-[300px]">
            <Image
              source={images.check}
              className="w-[110px] h-[110px] mx-auto my-4"
            />
            <Text className="text-2xl text-center text-black font-JakartaBold">
              Đăng ký thành công!
            </Text>
            <Text className="mt-4 text-base text-center text-gray-500 font-Jakarta">
              Chào mừng bạn đến với BenGo. Tài khoản của bạn đã sẵn sàng.
            </Text>
            <CustomButton
              title="Bắt đầu ngay"
              IconLeft={() => <Ionicons name="checkmark-circle-outline" size={20} color="white" />}
              onPress={() => {
                setShowSuccessModal(false);
                router.replace("/(root)/tabs/home");
              }}
              className="mt-4"
            />
          </View>
        </View>
      </Modal>

      {/* Modal for Verification (OTP) */}
      <Modal
        visible={verificationModal.visible}
        transparent animationType="fade"
      >
        <View
          className="flex-1 justify-center items-center px-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <View className="bg-white w-full p-6 rounded-2xl">
            <Text className="text-2xl text-center text-black font-JakartaBold">
              Xác thực tài khoản
            </Text>
            <Text className="mt-4 text-base text-center text-gray-500 font-Jakarta">
              Mã xác xác thực đã được gửi đến email {form.email}
            </Text>

            <InputField
              label="Mã xác thực (OTP)"
              placeholder="Nhập mã 4 số"
              icon="mail-unread-outline"
              value={verificationModal.otp}
              keyboardType="number-pad"
              maxLength={4}
              onChangeText={(otp) => setVerificationModal({ ...verificationModal, otp })}
            />
            <CustomButton
              title="Xác nhận"
              loading={loading}
              IconLeft={() => <Ionicons name="checkmark-outline" size={20} color="white" />}
              onPress={onVerifyPress}
              className="mt-4"
            />

            <CustomButton
              title="Hủy"
              bgVariant="outline"
              textVariant="primary"
              IconLeft={() => <Ionicons name="close-circle-outline" size={20} color="#38A169" />}
              onPress={() => setVerificationModal({ ...verificationModal, visible: false })}
              className="mt-4"
            />
          </View>
        </View>
      </Modal>

      <CustomModal
        visible={alertModal.visible}
        title={alertModal.title}
        message={alertModal.message}
        onClose={closeAlert}
      />
    </SafeAreaView>
  );
};

export default SignUp;

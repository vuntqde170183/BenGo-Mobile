import CustomButton from "@/components/Common/CustomButton";
import InputField from "@/components/Common/InputField";
import { icons, images } from "@/constants";
import { useAuth } from "@/context/AuthContext";
import { Link, router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  Text,
  View,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

const SignIn = () => {
  const { t } = useTranslation();
  const { login, user } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ account?: string; password?: string }>({});

  // Kiểm tra input là email hay số điện thoại
  const isEmail = (input: string): boolean => {
    return input.includes("@");
  };

  // Validate email
  const validateEmail = (emailInput: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailInput);
  };

  // Validate phone number (Việt Nam)
  const validatePhone = (phoneInput: string): boolean => {
    const phoneRegex = /^(0[3|5|7|8|9])[0-9]{8}$/;
    return phoneRegex.test(phoneInput);
  };

  // Handle login
  const handleLogin = async () => {
    // Reset errors
    setErrors({});

    // Validate
    let hasError = false;
    const newErrors: { account?: string; password?: string } = {};

    if (!account) {
      newErrors.account = "Vui lòng nhập email hoặc số điện thoại";
      hasError = true;
    } else if (isEmail(account)) {
      if (!validateEmail(account)) {
        newErrors.account = "Email không hợp lệ";
        hasError = true;
      }
    } else {
      if (!validatePhone(account)) {
        newErrors.account = "Số điện thoại không hợp lệ";
        hasError = true;
      }
    }

    if (!password) {
      newErrors.password = "Vui lòng nhập mật khẩu";
      hasError = true;
    } else if (password.length < 6) {
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    // Call API
    setIsLoading(true);
    try {
      const loggedInUser = await login(account, password);

      if (loggedInUser?.role === "DRIVER") {
        router.replace("/(driver)/tabs/home");
      } else {
        router.replace("/(root)/tabs/home");
      }
    } catch (error: any) {
      const errorMessage =
        error.message || "Tài khoản hoặc mật khẩu không đúng";
      Alert.alert("Lỗi đăng nhập", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Navigate to registration guide
  const handleRegister = () => {
    router.push("/(auth)/sign-up");
  };

  // Navigate to forgot password
  const handleForgotPassword = () => {
    Alert.alert("Thông báo", "Chuyển đến màn hình quên mật khẩu");
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
            <View className="items-center mb-8">
              <Text className="text-2xl text-gray-700 font-JakartaBold mb-2">
                Chào mừng bạn!
              </Text>
              <Text className="text-lg text-gray-500 font-JakartaMedium">
                Đăng nhập để tiếp tục cùng BenGo
              </Text>
            </View>

            {/* Form */}
            <View className="flex-1">
              <InputField
                label="Email hoặc Số điện thoại"
                placeholder="Nhập email hoặc số điện thoại"
                value={account}
                onChangeText={(text) => {
                  setAccount(text.trim());
                  if (errors.account) {
                    setErrors(prev => ({ ...prev, account: undefined }));
                  }
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.account}
                icon="person-outline"
              />

              {/* Password Input */}
              <InputField
                label="Mật khẩu"
                placeholder="Nhập mật khẩu"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) {
                    setErrors(prev => ({ ...prev, password: undefined }));
                  }
                }}
                secureTextEntry
                error={errors.password}
                icon="lock-closed-outline"
              />

              {/* Forgot Password */}
              <TouchableOpacity
                className="self-end mb-4"
                onPress={handleForgotPassword}
              >
                <Text className="text-green-600 font-JakartaBold">
                  Quên mật khẩu?
                </Text>
              </TouchableOpacity>

              {/* Login Button */}
              <CustomButton
                title="ĐĂNG NHẬP"
                onPress={handleLogin}
                loading={isLoading}
                className="mb-4"
              />

              {/* Register Link */}
              <View className="flex-row justify-center items-center mt-4 mb-8">
                <Text className="text-gray-500 font-JakartaMedium">Chưa có tài khoản? </Text>
                <TouchableOpacity onPress={handleRegister}>
                  <Text className="text-green-600 font-JakartaBold">Đăng ký ngay</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Footer */}
            <View className="flex-row justify-center items-center py-4">
              <TouchableOpacity>
                <Text className="text-base text-gray-500 font-JakartaMedium">Điều khoản</Text>
              </TouchableOpacity>
              <Text className="mx-2 text-gray-300">|</Text>
              <TouchableOpacity>
                <Text className="text-base text-gray-500 font-JakartaMedium">Chính sách</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignIn;

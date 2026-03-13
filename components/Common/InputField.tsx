import { useState } from "react";
import {
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  View,
  Text,
  Image,
  TextInput,
  Platform,
  Keyboard,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { InputFieldProps } from "@/types/type";

const InputField = ({
  label,
  labelStyle,
  icon,
  iconRight,
  secureTextEntry = false,
  containerStyle,
  inputStyle,
  iconStyle,
  className,
  error,
  ...props
}: InputFieldProps) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View className="my-2 w-full">
      {label && (
        <Text
          className={`text-lg font-JakartaSemiBold mb-2 text-green-600 ${labelStyle}`}
        >
          {label}
        </Text>
      )}
      <View
        className={`flex flex-row justify-start items-center relative 
        bg-neutral-100 rounded-full border ${error ? "border-red-500" : "border-gray-300"} focus:border-green-500  ${containerStyle}`}
      >
        {icon &&
          (typeof icon === "string" && !icon.startsWith("http") ? (
            <Ionicons
              name={icon as any}
              size={20}
              color="#6B7280"
              style={{ marginLeft: 16 }}
            />
          ) : (
            <Image
              source={icon}
              className={`w-6 h-6 ml-4 ${iconStyle}`}
              style={iconStyle?.startsWith("#") ? { tintColor: iconStyle } : {}}
            />
          ))}
        <TextInput
          className={`rounded-full p-4 font-JakartaSemiBold text-[15px] flex-1 ${inputStyle} text-left`}
          secureTextEntry={secureTextEntry && !showPassword}
          {...props}
          placeholderTextColor={"#AAAAAA"}
        />
        {iconRight && (
          <View className="pr-4">
            {iconRight}
          </View>
        )}
        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            className="pr-4"
          >
            <Ionicons
              name={showPassword ? "eye" : "eye-off"}
              size={24}
              color="#6B7280"
            />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text className="text-red-500 text-base mt-1 ml-2 font-JakartaMedium">
          {error}
        </Text>
      )}
    </View>
  );
};

export default InputField;

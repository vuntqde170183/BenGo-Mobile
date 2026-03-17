import { ActivityIndicator, Text, TouchableOpacity } from "react-native";

import { ButtonProps } from "@/types/type";

const getBgVariantStyle = (variant: ButtonProps["bgVariant"]) => {
  switch (variant) {
    case "secondary":
      return "bg-gray-500";
    case "danger":
      return "bg-red-500";
    case "success":
      return "bg-green-500";
    case "outline":
      return "bg-green-50 border-primary-500 border-[1px]";
    case "amber":
      return "bg-amber-50 border-amber-500 border-[1px]";
    case "red":
      return "bg-red-50 border-red-500 border-[1px]";
    default:
      return "bg-[#38A169]";
  }
};

const getTextVariantStyle = (variant: ButtonProps["textVariant"]) => {
  switch (variant) {
    case "primary":
      return "text-primary-500";
    case "amber":
      return "text-amber-600";
    case "red":
      return "text-red-600";
    case "secondary":
      return "text-gray-100";
    case "danger":
      return "text-white";
    case "success":
      return "text-green-100";
    default:
      return "text-white";
  }
};

const CustomButton = ({
  onPress,
  title,
  bgVariant = "primary",
  textVariant = "default",
  IconLeft,
  IconRight,
  className,
  loading = false,
  ...props
}: ButtonProps) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={loading || props.disabled}
    className={`flex flex-row justify-center items-center p-4 py-3 w-full rounded-full gap-1 ${getBgVariantStyle(bgVariant)} ${className} ${loading ? "opacity-70" : ""}`}
    style={[
      { minHeight: 40 },
      !className?.includes("shadow-none") && bgVariant !== "outline" && {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
      },
      props.style,
    ]}
    {...props}
  >
    {loading ? (
      <ActivityIndicator
        color={textVariant === "primary" ? "#000" : "#fff"}
        size="small"
      />
    ) : (
      <>
        {IconLeft && <IconLeft />}
        <Text
          className={`text-lg font-bold ${getTextVariantStyle(textVariant)}`}
        >
          {title}
        </Text>
        {IconRight && <IconRight />}
      </>
    )}
  </TouchableOpacity>
);

export default CustomButton;

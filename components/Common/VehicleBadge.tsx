import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { vehicleTypes } from "@/constants";

interface VehicleBadgeProps {
    type: string;
    showIcon?: boolean;
    containerStyle?: string;
}

const VehicleBadge = ({ type, showIcon = true, containerStyle = "" }: VehicleBadgeProps) => {
    const config = (vehicleTypes as any)[type] || vehicleTypes.VAN;

    return (
        <View className={`flex-row items-center ${containerStyle}`}>
            {showIcon && (
                <Ionicons 
                    name={config.icon as any} 
                    size={20} 
                    color={config.color} 
                />
            )}
            <Text 
                className="ml-2 text-sm font-JakartaBold" 
                style={{ color: config.color }}
            >
                {config.label}
            </Text>
        </View>
    );
};

export default VehicleBadge;

import { useQuery } from "@tanstack/react-query";
import * as CustomerApi from "@/api/customer";

export const useNearbyDrivers = (lat: number | null, lng: number | null, radius: number = 5) => {
    return useQuery({
        queryKey: ["nearby-drivers", lat, lng, radius],
        queryFn: () => CustomerApi.getNearbyDrivers(lat!, lng!, radius),
        enabled: !!lat && !!lng,
    });
};

export const useCustomerProfile = (userId: string | null) => {
    return useQuery({
        queryKey: ["customer-profile", userId],
        queryFn: () => CustomerApi.getProfile(userId!),
        enabled: !!userId,
    });
};

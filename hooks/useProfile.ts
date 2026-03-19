import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAPI } from "@/lib/fetch";
import { User } from "@/types/type";

export const useProfile = () => {
    return useQuery<User>({
        queryKey: ["profile"],
        queryFn: async () => {
            const response = await fetchAPI("/(api)/auth/profile");
            return response.data ?? response;
        },
        retry: 1,
    });
};

export interface UpdateProfilePayload {
  phone?: string;
  email?: string;
  name?: string;
  avatar?: string;
  driverProfile?: {
    vehicleType?: string;
    plateNumber?: string;
    licenseImage?: string;
    identityNumber?: string;
    identityFrontImage?: string;
    identityBackImage?: string;
    drivingLicenseNumber?: string;
    vehicleRegistrationImage?: string;
    bankInfo?: {
      bankName?: string;
      accountNumber?: string;
      accountHolder?: string;
    };
  };
}

export const useUpdateProfile = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: UpdateProfilePayload) => {
            const response = await fetchAPI("/auth/profile", {
                method: "PUT",
                body: JSON.stringify(payload),
            });
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["profile"] });
        },
    });
};

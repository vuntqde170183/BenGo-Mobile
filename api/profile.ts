import { fetchAPI } from "@/lib/fetch";
import { User } from "@/types/type";

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

export const getProfile = async (): Promise<User> => {
  const response = await fetchAPI("/(api)/auth/profile");
  return response.data ?? response;
};

export const updateProfile = async (payload: UpdateProfilePayload) => {
  return fetchAPI("/auth/profile", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
};

import { fetchAPI } from "@/lib/fetch";

export interface RegisterPayload {
    phone: string;
    password: string;
    name: string;
    email: string;
    type: "CUSTOMER" | "DRIVER";
}

export interface VerifyRegisterPayload {
    email: string;
    otp: string;
}

export const register = async (data: RegisterPayload) => {
    return fetchAPI("/(api)/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
    });
};

export const verifyRegister = async (data: VerifyRegisterPayload) => {
    return fetchAPI("/(api)/auth/verify-register", {
        method: "POST",
        body: JSON.stringify(data),
    });
};

export const getSessionUser = async () => {
    return fetchAPI("/(api)/auth/session");
};

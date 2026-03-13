import { fetchAPI } from "@/lib/fetch";

export interface UserRegistrationData {
    name: string;
    email: string;
    clerkId: string;
}

export const registerUser = async (data: UserRegistrationData) => {
    return fetchAPI("/(api)/user", {
        method: "POST",
        body: JSON.stringify(data),
    });
};

export const getSessionUser = async () => {
    return fetchAPI("/(api)/auth/session");
};

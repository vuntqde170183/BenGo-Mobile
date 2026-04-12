import { useMutation } from "@tanstack/react-query";
import { register, verifyRegister, RegisterPayload, VerifyRegisterPayload } from "@/api/auth";

export const useRegister = () => {
    return useMutation({
        mutationFn: (data: RegisterPayload) => register(data),
    });
};

export const useVerifyRegister = () => {
    return useMutation({
        mutationFn: (data: VerifyRegisterPayload) => verifyRegister(data),
    });
};

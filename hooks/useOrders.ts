import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as OrderApi from "@/api/orders";

export const useOrderHistory = (params: { status?: string; page?: number; limit?: number; enabled?: boolean }) => {
    return useQuery({
        queryKey: ["orders-history", params],
        queryFn: () => OrderApi.getOrderHistory(params),
        enabled: params.enabled !== false,
    });
};

export const useOrderDetails = (id: string) => {
    return useQuery({
        queryKey: ["order-details", id],
        queryFn: () => OrderApi.getOrderDetails(id),
        enabled: !!id,
        refetchInterval: 4000,
    });
};

export const useCreateOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: OrderApi.createOrder,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["orders-history"] });
        },
    });
};

export const usePayOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ orderId, paymentMethod }: { orderId: string; paymentMethod: string }) =>
            OrderApi.payOrder(orderId, paymentMethod),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["order-details", variables.orderId] });
            queryClient.invalidateQueries({ queryKey: ["orders-history"] });
        },
    });
};

export const useRateOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ orderId, rating }: { orderId: string; rating: { star: number; comment?: string } }) =>
            OrderApi.rateOrder(orderId, rating),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["order-details", variables.orderId] });
            queryClient.invalidateQueries({ queryKey: ["orders-history"] });
        },
    });
};

export const useCancelOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ orderId, reason }: { orderId: string; reason: string }) =>
            OrderApi.cancelOrder(orderId, reason),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["order-details", variables.orderId] });
            queryClient.invalidateQueries({ queryKey: ["orders-history"] });
        },
    });
};

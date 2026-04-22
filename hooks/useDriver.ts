import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as DriverApi from "@/api/driver";

export const useDriverPendingOrders = (lat: number | null, lng: number | null, radius: number = 5) => {
    return useQuery({
        queryKey: ["driver-pending-orders", lat, lng, radius],
        queryFn: () => DriverApi.getPendingOrders(lat!, lng!, radius),
        enabled: !!lat && !!lng,
    });
};

export const useDriverActiveOrder = () => {
    return useQuery({
        queryKey: ["driver-active-order"],
        queryFn: async () => {
            const response = await DriverApi.getOrders({ status: "ACCEPTED", limit: 1 });
            const accepted = response.data?.data?.[0];
            if (accepted) return accepted;

            const pickedUpResponse = await DriverApi.getOrders({ status: "PICKED_UP", limit: 1 });
            return pickedUpResponse.data?.data?.[0] || null;
        },
    });
};

export const useDriverStats = (from: string, to: string, options?: { enabled?: boolean; refetchInterval?: number }) => {
    return useQuery({
        queryKey: ["driver-stats", from, to],
        queryFn: () => DriverApi.getStats(from, to),
        enabled: (options?.enabled !== false) && !!from && !!to,
        ...options
    });
};

export const useDriverOrders = (params: { page?: number; limit?: number; status?: string; search?: string; time?: string; enabled?: boolean }) => {
    return useQuery({
        queryKey: ["driver-orders", params],
        queryFn: () => DriverApi.getOrders(params),
        enabled: params.enabled !== false,
        refetchInterval: 4000,
        refetchIntervalInBackground: true,
    });
};

export const useDriverOrderDetail = (id: string | null) => {
    console.log('📡 [Hook] useDriverOrderDetail called for ID:', id);
    return useQuery({
        queryKey: ["order-detail", id],
        queryFn: () => DriverApi.getOrderDetails(id!),
        enabled: !!id,
    });
};

// Mutations
export const useDriverToggleStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: DriverApi.toggleStatus,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["driver-profile"] });
        },
    });
};

export const useDriverAcceptOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (orderId: string) => DriverApi.acceptOrder(orderId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["driver-pending-orders"] });
            queryClient.invalidateQueries({ queryKey: ["driver-orders"] });
            queryClient.invalidateQueries({ queryKey: ["driver-active-order"] });
        },
    });
};

export const useDriverUpdateLocation = () => {
    return useMutation({
        mutationFn: DriverApi.updateLocation,
    });
};

export const useDriverDocuments = (id: string | null) => {
    return useQuery({
        queryKey: ["driver-documents", id],
        queryFn: () => DriverApi.getDocuments(id!),
        enabled: !!id,
    });
};

export const useUpdateDriverDocuments = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: DriverApi.updateDocuments,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["driver-documents", variables.id] });
        },
    });
};

export const useDriverUpdateOrderStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) => DriverApi.updateOrderStatus(id, status),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["order-detail", variables.id] });
            queryClient.invalidateQueries({ queryKey: ["driver-orders"] });
            queryClient.invalidateQueries({ queryKey: ["driver-active-order"] });
        },
    });
};

import { fetchAPI } from "@/lib/fetch";

export interface PendingOrder {
    orderId: string;
    distance: number;
    price: number;
    pickup: {
        lat: number;
        lng: number;
        address?: string;
    };
    destination: {
        lat: number;
        lng: number;
        address?: string;
    };
}

export interface DriverStats {
    totalEarnings: number;
    totalTrips: number;
    rating: number;
}

export interface OrderHistoryItem {
    id: string;
    status: 'PENDING' | 'ACCEPTED' | 'PICKED_UP' | 'DELIVERED' | 'CANCELLED';
    pickupAddress: string;
    dropoffAddress: string;
    totalPrice: number;
    createdAt: string;
}

export interface OrderDetail extends OrderHistoryItem {
    customerId: { _id: string; name: string; phone: string };
    driverId?: { _id: string; name: string; phone: string; avatar?: string };
    pickup: { address: string; lat: number; lng: number };
    dropoff: { address: string; lat: number; lng: number };
    vehicleType: string;
    goodsImages?: string[];
    distanceKm: number;
    paymentMethod: 'CASH' | 'WALLET';
    paymentStatus: 'UNPAID' | 'PAID';
    priority: 'NORMAL' | 'VIP' | 'URGENT' | 'FRAGILE';
    specialNote?: string;
    tags?: string[];
    updatedAt: string;
}

export const toggleStatus = async (payload: { isOnline: boolean; location: { lat: number; lng: number } }) => {
    return fetchAPI("/(api)/driver/status", {
        method: "PUT",
        body: JSON.stringify(payload),
    });
};

export const getPendingOrders = async (lat: number, lng: number, radius: number = 5): Promise<PendingOrder[]> => {
    const response = await fetchAPI(`/(api)/driver/orders/pending?lat=${lat}&lng=${lng}&radius=${radius}`);
    return response.data || [];
};

export const acceptOrder = async (orderId: string) => {
    return fetchAPI(`/(api)/driver/orders/${orderId}/accept`, {
        method: "POST",
    });
};

export const getStats = async (from: string, to: string): Promise<DriverStats> => {
    const response = await fetchAPI(`/(api)/driver/stats?from=${from}&to=${to}`);
    return response.data || { totalEarnings: 0, totalTrips: 0, rating: 5 };
};

export const updateLocation = async (location: { lat: number; lng: number; heading?: number }) => {
    return fetchAPI("/(api)/driver/location", {
        method: "PUT",
        body: JSON.stringify(location),
    });
};

export const getOrders = async (params: { page?: number; limit?: number; status?: string; search?: string; time?: string }) => {
    const { page = 1, limit = 10, status = 'ALL', search = '', time = 'today' } = params;
    const response = await fetchAPI(`/(api)/driver/orders?page=${page}&limit=${limit}&status=${status}&search=${search}&time=${time}`);
    return response || { data: { data: [], meta: { total: 0, page: 1, limit: 10 } } };
};

export const getOrderDetails = async (id: string): Promise<OrderDetail> => {
    const response = await fetchAPI(`/(api)/orders/${id}`);
    return response.data;
};

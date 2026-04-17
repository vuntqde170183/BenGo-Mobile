import { fetchAPI } from "@/lib/fetch";

export type OrderStatus = "PENDING" | "ACCEPTED" | "PICKED_UP" | "DELIVERED" | "CANCELLED";

export interface Order {
    id: string;
    _id?: string; // Giữ lại dự phòng nếu cần
    pickup: {
        address: string;
        lat: number;
        lng: number;
    };
    dropoff: {
        address: string;
        lat: number;
        lng: number;
    };
    vehicleType: string;
    status: OrderStatus;
    totalPrice: number;
    distanceKm: number;
    paymentMethod: "CASH" | "WALLET";
    paymentStatus: "PAID" | "UNPAID";
    goodsImages: string[];
    createdAt: string;
    specialNote?: string;
    priority?: "NORMAL" | "VIP" | "URGENT" | "FRAGILE";
    tags?: string[];
    customer?: {
        _id?: string;
        name: string;
        phone: string;
        email?: string;
    };
    driverId?: {
        _id: string;
        name: string;
        phone: string;
        avatar?: string;
        currentLocation?: { lat: number; lng: number };
        licensePlate?: string;
        rating?: number;
    };
    driver?: {
        _id: string;
        name: string;
        phone: string;
        avatar?: string;
        licensePlate?: string;
        rating?: number;
        currentLocation?: { lat: number; lng: number };
    } | null;
}

export const getOrderHistory = async (params: { status?: string; page?: number; limit?: number }): Promise<Order[]> => {
    const queryParams = new URLSearchParams();
    if (params.status && params.status !== "ALL") queryParams.append("status", params.status);
    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());

    const response = await fetchAPI(`/(api)/orders/history?${queryParams.toString()}`);
    return response.data ?? response;
};

export const getOrderDetails = async (id: string): Promise<Order> => {
    const response = await fetchAPI(`/(api)/orders/${id}`);
    return response.data ?? response;
};

export const createOrder = async (orderData: any) => {
    return fetchAPI("/(api)/orders", {
        method: "POST",
        body: JSON.stringify(orderData),
    });
};

export const payOrder = async (orderId: string, paymentMethod: string) => {
    return fetchAPI("/(api)/payment/pay", {
        method: "POST",
        body: JSON.stringify({ orderId, paymentMethod }),
    });
};

export const rateOrder = async (orderId: string, rating: { star: number; comment?: string }) => {
    return fetchAPI(`/(api)/orders/${orderId}/rate`, {
        method: "POST",
        body: JSON.stringify(rating),
    });
};

export const cancelOrder = async (orderId: string, reason: string) => {
    return fetchAPI(`/(api)/orders/${orderId}/cancel`, {
        method: "PUT",
        body: JSON.stringify({ reason }),
    });
};

export const uploadDeliveryProof = async (orderId: string, proofData: { proofImage: string; notes?: string }) => {
    return fetchAPI(`/(api)/orders/delivery-proof/${orderId}`, {
        method: "POST",
        body: JSON.stringify(proofData),
    });
};

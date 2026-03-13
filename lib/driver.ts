import { fetchAPI } from "./fetch";

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

export const driverService = {
  toggleStatus: async (payload: { isOnline: boolean; location: { lat: number; lng: number } }) => {
    return await fetchAPI("/(api)/driver/status", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  getPendingOrders: async (lat: number, lng: number, radius: number = 5): Promise<PendingOrder[]> => {
    const response = await fetchAPI(`/(api)/driver/orders/pending?lat=${lat}&lng=${lng}&radius=${radius}`);
    return response.data || [];
  },

  acceptOrder: async (orderId: string) => {
    return await fetchAPI(`/(api)/driver/orders/${orderId}/accept`, {
      method: "POST",
    });
  },

  getStats: async (from: string, to: string): Promise<DriverStats> => {
    const response = await fetchAPI(`/(api)/driver/stats?from=${from}&to=${to}`);
    return response.data || { totalEarnings: 0, totalTrips: 0, rating: 5 };
  },

  updateLocation: async (location: { lat: number; lng: number; heading?: number }) => {
    return await fetchAPI("/(api)/driver/location", {
      method: "PUT",
      body: JSON.stringify(location),
    });
  },

  getOrders: async (params: { page?: number; limit?: number; status?: string; search?: string }): Promise<{ data: { data: OrderHistoryItem[], meta: { total: number, page: number, limit: number } } }> => {
    const { page = 1, limit = 10, status = 'ALL', search = '' } = params;
    const response = await fetchAPI(`/(api)/driver/orders?page=${page}&limit=${limit}&status=${status}&search=${search}`);
    return response || { data: { data: [], meta: { total: 0, page: 1, limit: 10 } } };
  },

  getOrderDetails: async (id: string): Promise<OrderDetail> => {
    const response = await fetchAPI(`/(api)/orders/${id}`);
    return response.data;
  },
};

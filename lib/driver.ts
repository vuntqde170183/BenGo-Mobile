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
};

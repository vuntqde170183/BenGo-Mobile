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
    customerId?: { _id: string; name: string; phone: string };
    customer?: { _id?: string; name: string; phone: string; email?: string };
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
    deliveryProof?: string;
    deliveryNotes?: string;
    tags?: string[];
    updatedAt: string;
}

export interface DriverDocument {
  type: "IDENTITY_FRONT" | "IDENTITY_BACK" | "DRIVING_LICENSE" | "VEHICLE_REGISTRATION";
  imageUrl: string | null;
  status: "APPROVED" | "PENDING" | "REJECTED" | "LOCKED";
}

export interface DriverDocumentsResponse {
  statusCode: number;
  message: string;
  data: {
    _id: string;
    phone: string;
    email: string;
    name: string;
    role: "DRIVER";
    walletBalance: number;
    active: boolean;
    driverProfile: {
      location: { type: "Point"; coordinates: [number, number] };
      _id: string;
      userId: string;
      vehicleType: string;
      plateNumber: string;
      licenseImage: string | null;
      status: "APPROVED" | "PENDING" | "REJECTED" | "LOCKED";
      identityNumber: string | null;
      identityFrontImage: string | null;
      identityBackImage: string | null;
      drivingLicenseNumber: string | null;
      vehicleRegistrationImage: string | null;
      bankInfo: {
        bankName: string;
        accountNumber: string;
        accountHolder: string;
      } | null;
      rejectionReason?: string | null;
      adminNote?: string | null;
    };
  };
  meta: {
    timestamp: string;
    apiVersion: string;
  };
}

export interface UpdateDocumentPayload {
  id: string;
  type: "IDENTITY_FRONT" | "IDENTITY_BACK" | "DRIVING_LICENSE" | "VEHICLE_REGISTRATION";
  imageUrl: string;
  identityNumber?: string;
  drivingLicenseNumber?: string;
  plateNumber?: string;
  vehicleType?: string;
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

export const getDocuments = async (id: string): Promise<DriverDocumentsResponse> => {
  const response = await fetchAPI(`/(api)/driver/${id}/documents`);
  return response;
};

export const updateDocuments = async (payload: UpdateDocumentPayload) => {
  const { id, ...rest } = payload;
  const response = await fetchAPI(`/(api)/driver/${id}/documents`, {
    method: "POST",
    body: JSON.stringify(rest),
  });
  return response;
};

export const updateOrderStatus = async (id: string, status: string) => {
  return fetchAPI(`/(api)/driver/orders/${id}/update`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
};

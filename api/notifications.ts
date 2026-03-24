import { fetchAPI } from "@/lib/fetch";

export interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  data?: {
    orderId?: string;
    status?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export const getNotifications = async (): Promise<Notification[]> => {
  const response = await fetchAPI("/(api)/notifications");
  return response.data || response;
};

export const markAsRead = async (id: string) => {
  return fetchAPI(`/(api)/notifications/${id}/read`, {
    method: "PUT",
  });
};

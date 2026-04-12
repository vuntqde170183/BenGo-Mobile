import { Driver, MarkerData } from "@/types/type";
import { calculateRidePrice, calculateSurgeMultiplier } from "./pricing";

const directionsAPI = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;

export const generateMarkersFromData = ({
  data,
  userLatitude,
  userLongitude,
}: {
  data: Driver[];
  userLatitude: number;
  userLongitude: number;
}): MarkerData[] => {
  return data.map((driver) => {
    const latOffset = (Math.random() - 0.5) * 0.01; // Random offset between -0.005 and 0.005
    const lngOffset = (Math.random() - 0.5) * 0.01; // Random offset between -0.005 and 0.005

    return {
      latitude: userLatitude + latOffset,
      longitude: userLongitude + lngOffset,
      title: `${driver.first_name} ${driver.last_name}`,
      ...driver,
    };
  });
};

export const calculateRegion = ({
  userLatitude,
  userLongitude,
  destinationLatitude,
  destinationLongitude,
}: {
  userLatitude: number | null;
  userLongitude: number | null;
  destinationLatitude?: number | null;
  destinationLongitude?: number | null;
}) => {
  if (!userLatitude || !userLongitude) {
    return {
      latitude: 21.0379,
      longitude: 105.8342,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }

  if (!destinationLatitude || !destinationLongitude) {
    return {
      latitude: userLatitude,
      longitude: userLongitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }

  const minLat = Math.min(userLatitude, destinationLatitude);
  const maxLat = Math.max(userLatitude, destinationLatitude);
  const minLng = Math.min(userLongitude, destinationLongitude);
  const maxLng = Math.max(userLongitude, destinationLongitude);

  const latitudeDelta = (maxLat - minLat) * 1.3; // Adding some padding
  const longitudeDelta = (maxLng - minLng) * 1.3; // Adding some padding

  const latitude = (userLatitude + destinationLatitude) / 2;
  const longitude = (userLongitude + destinationLongitude) / 2;

  return {
    latitude,
    longitude,
    latitudeDelta,
    longitudeDelta,
  };
};

export const calculateDriverTimes = async ({
  markers,
  userLatitude,
  userLongitude,
  destinationLatitude,
  destinationLongitude,
}: {
  markers: MarkerData[];
  userLatitude: number | null;
  userLongitude: number | null;
  destinationLatitude: number | null;
  destinationLongitude: number | null;
}) => {
  if (
    !userLatitude ||
    !userLongitude ||
    !destinationLatitude ||
    !destinationLongitude
  )
    return [];

  try {
    const timesPromises = markers.map(async (marker) => {
      const responseToUser = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${Number(marker.latitude)},${Number(marker.longitude)}&destination=${Number(userLatitude)},${Number(userLongitude)}&key=${directionsAPI}`,
      );
      const dataToUser = await responseToUser.json();

      if (!dataToUser.routes || dataToUser.routes.length === 0) {
        return { ...marker, time: 0, price: "0" };
      }

      const timeToUser = dataToUser.routes[0].legs[0].duration.value; // Time in seconds

      const responseToDestination = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${Number(userLatitude)},${Number(userLongitude)}&destination=${Number(destinationLatitude)},${Number(destinationLongitude)}&key=${directionsAPI}`,
      );
      const dataToDestination = await responseToDestination.json();

      if (!dataToDestination.routes || dataToDestination.routes.length === 0) {
        return { ...marker, time: 0, price: "0" };
      }

      const timeToDestination =
        dataToDestination.routes[0].legs[0].duration.value; // Time in seconds

      const totalTime = (timeToUser + timeToDestination) / 60; // Total time in minutes
      const distanceInMeters = dataToDestination.routes[0].legs[0].distance.value;

      const surgeMultiplier = calculateSurgeMultiplier(new Date());

      // Tính giá sử dụng utility function
      const pricingResult = calculateRidePrice({
        basePrice: 15000, // Giá khởi điểm cơ bản (15,000 VND)
        timeInMinutes: totalTime, // Tổng thời gian di chuyển (phút) = thời gian tài xế đến + thời gian đi đến đích
        distanceInMeters: distanceInMeters, // Khoảng cách từ vị trí người dùng đến điểm đến (mét)
        serviceFeeRate: 0.1, // Tỷ lệ phí dịch vụ (10% trên giá cơ bản)
        taxRate: 0.1, // Tỷ lệ thuế VAT (10% trên tổng phụ)
        surgeMultiplier: surgeMultiplier, // Hệ số tăng giá theo thời gian cao điểm (1.0 - 2.5x)
        vehicleType: marker.vehicle_type, // Loại phương tiện (motorbike, car, suv, van, luxury)
        carSeats: marker.car_seats // Số chỗ ngồi của xe (ảnh hưởng đến hệ số giá)
      });

      const price = pricingResult.totalPrice.toString();

      return { ...marker, time: totalTime, price };
    });

    return await Promise.all(timesPromises);
  } catch (error) {
    return [];
  }
};

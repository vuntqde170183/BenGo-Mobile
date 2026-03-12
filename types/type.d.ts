import { TextInputProps, TouchableOpacityProps } from "react-native";

declare enum RideStatus {
  PENDING = 'pending',           // Chờ xác nhận
  CONFIRMED = 'confirmed',       // Tài xế đã nhận chuyến
  DRIVER_ARRIVED = 'driver_arrived', // Tài xế đã đến
  IN_PROGRESS = 'in_progress',   // Đang trong chuyến
  COMPLETED = 'completed',       // Hoàn thành
  CANCELLED = 'cancelled',       // Đã hủy
  NO_SHOW = 'no_show'           // Khách không xuất hiện
}

declare interface Driver {
  id: number;
  first_name: string;
  last_name: string;
  profile_image_url: string;
  car_image_url: string;
  car_seats: number;
  rating: number;
  vehicle_type: string;
  approval_status: string;
}

declare interface MarkerData {
  latitude: number;
  longitude: number;
  id: number;
  title: string;
  profile_image_url: string;
  car_image_url: string;
  car_seats: number;
  rating: number;
  first_name: string;
  last_name: string;
  vehicle_type: string;
  approval_status: string;
  time?: number;
  price?: string;
}

declare interface MapProps {
  destinationLatitude?: number;
  destinationLongitude?: number;
  onDriverTimesCalculated?: (driversWithTimes: MarkerData[]) => void;
  selectedDriver?: number | null;
  onMapReady?: () => void;
}

export interface Ride {
  ride_id?: number | string;
  origin_address: string;
  destination_address: string;
  origin_latitude: number;
  origin_longitude: number;
  destination_latitude: number;
  destination_longitude: number;
  ride_time: number;
  fare_price: number;
  payment_status: string;
  ride_status: RideStatus;
  driver_id: number;
  user_id: string;
  passenger_id: string;
  created_at: string;
  cancelled_at?: string;
  cancel_reason?: string;
  payment_intent_id?: string;
  rating_id?: number;
  rating?: {
    id: number;
    stars: number;
    comment?: string;
    created_at: string;
  };
  driver: {
    driver_id?: number;
    first_name: string;
    last_name: string;
    car_seats: number;
    profile_image_url?: string;
    car_image_url?: string;
    rating?: number;
    vehicle_type: string;
  };
  passenger?: {
    clerk_id: string | null;
    name: string | null;
    email: string | null;
    phone: string | null;
  };
}

declare interface Rating {
  id: number;
  ride_id: number;
  user_id: string;
  driver_id: number;
  stars: number;
  comment?: string;
  created_at: string;
}

declare interface ButtonProps extends TouchableOpacityProps {
  title: string;
  bgVariant?: "primary" | "secondary" | "danger" | "outline" | "success" | "amber" | "red";
  textVariant?: "primary" | "default" | "secondary" | "danger" | "success" | "amber" | "red";
  IconLeft?: React.ComponentType<any>;
  IconRight?: React.ComponentType<any>;
  className?: string;
  loading?: boolean;
}

declare interface GoogleInputProps {
  icon?: string;
  initialLocation?: string;
  containerStyle?: string;
  textInputBackgroundColor?: string;
  handlePress: ({
    latitude,
    longitude,
    address,
  }: {
    latitude: number;
    longitude: number;
    address: string;
  }) => void;
}

declare interface InputFieldProps extends TextInputProps {
  label: string;
  icon?: any;
  secureTextEntry?: boolean;
  labelStyle?: string;
  containerStyle?: string;
  inputStyle?: string;
  iconStyle?: string;
  className?: string;
  error?: string;
}

declare interface PaymentProps {
  fullName: string;
  email: string;
  amount: string;
  driverId: number;
  rideTime: number;
  originAddress: string;
  destinationAddress: string;
  originLatitude: number;
  originLongitude: number;
  destinationLatitude: number;
  destinationLongitude: number;
}

declare interface LocationStore {
  userLatitude: number | null;
  userLongitude: number | null;
  userAddress: string | null;
  destinationLatitude: number | null;
  destinationLongitude: number | null;
  destinationAddress: string | null;
  setUserLocation: ({
    latitude,
    longitude,
    address,
  }: {
    latitude: number;
    longitude: number;
    address: string;
  }) => void;
  setDestinationLocation: ({
    latitude,
    longitude,
    address,
  }: {
    latitude: number;
    longitude: number;
    address: string;
  }) => void;
}

declare interface DriverStore {
  drivers: MarkerData[];
  selectedDriver: number | null;
  setSelectedDriver: (driverId: number) => void;
  setDrivers: (drivers: MarkerData[]) => void;
  clearSelectedDriver: () => void;
}

declare interface DriverCardProps {
  item: MarkerData;
  selected: number;
  setSelected: () => void;
}

// Promo Code Types
declare interface PromoCode {
  id: number;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed_amount' | 'free_ride';
  discount_value: number;
  max_discount_amount?: number;
  min_ride_amount: number;
  max_uses?: number;
  max_uses_per_user: number;
  current_uses: number;
  valid_from: string;
  valid_until?: string;
  user_type: 'all' | 'new_users' | 'existing_users';
  is_active: boolean;
  created_at: string;
}

declare interface PromoCodeUsage {
  id: number;
  promo_code_id: number;
  user_id: string;
  ride_id?: number;
  original_amount: number;
  discount_amount: number;
  final_amount: number;
  used_at: string;
}

declare interface PromoCodeData {
  promo_code_id: number;
  code: string;
  discount_type: string;
  discount_value: number;
  original_amount: number;
  discount_amount: number;
  final_amount: number;
}

declare interface PromoStore {
  appliedPromo: PromoCodeData | null;
  availablePromos: PromoCode[];
  isValidating: boolean;
  setAppliedPromo: (promo: PromoCodeData | null) => void;
  setAvailablePromos: (promos: PromoCode[]) => void;
  setIsValidating: (isValidating: boolean) => void;
  clearPromo: () => void;
}

// Driver Mode Types
declare interface DriverProfile {
  id: number;
  clerk_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  profile_image_url?: string;
  car_image_url?: string;
  vehicle_type: "car" | "bike" | "suv";
  car_seats: number;
  license_number: string;
  approval_status: "pending" | "approved" | "rejected" | "suspended";
  status: "offline" | "online" | "on_ride" | "picking_up";
  rating: number;
  rating_count: number;
  average_rating: number;
  total_rides: number;
  completed_rides: number;
  cancelled_rides: number;
  total_earnings: number;
  current_latitude?: number;
  current_longitude?: number;
  last_location_update?: string;
  warning_count: number;
  created_at: string;
  updated_at: string;
  total_warnings: string;
  active_warnings: string;
  recentRides: {
    ride_id: number;
    origin_address: string;
    destination_address: string;
    fare_price: number;
    ride_status: string;
    created_at: string;
  }[];
  recentRatings: {
    id: number;
    stars: number;
    comment: string;
    created_at: string;
    user_name: string;
  }[];
}

declare interface DriverDocument {
  id: number;
  driver_id: number;
  document_type:
    | "license"
    | "registration"
    | "insurance"
    | "profile_photo"
    | "vehicle_photo";
  document_url: string;
  status: "pending" | "approved" | "rejected";
  uploaded_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  rejection_reason?: string;
}

declare interface DriverEarnings {
  total_earnings: number;
  total_commission: number;
  net_earnings: number;
  total_rides: number;
  earnings_by_date: {
    date: string;
    amount: number;
    rides: number;
  }[];
}

declare interface RideRequest {
  ride_id: number;
  user_id: string;
  passenger_name: string;
  passenger_phone: string;
  pickup_address: string;
  pickup_latitude: number;
  pickup_longitude: number;
  destination_address: string;
  destination_latitude: number;
  destination_longitude: number;
  fare_price: number;
  distance: number;
  estimated_time: number;
  created_at: string;
}

declare interface DriverModeStore {
  // Driver info
  driverProfile: DriverProfile | null;
  isDriver: boolean;

  // Driver status
  driverStatus: "online" | "offline" | "on_ride" | "picking_up";
  currentLocation: { latitude: number; longitude: number } | null;

  // Active ride
  activeRide: Ride | null;
  rideRequests: RideRequest[];

  // Earnings
  todayEarnings: number;
  weekEarnings: number;
  monthEarnings: number;

  // Actions
  setDriverProfile: (profile: DriverProfile | null) => void;
  updateDriverStatus: (status: string) => void;
  updateLocation: (location: { latitude: number; longitude: number }) => void;
  setActiveRide: (ride: Ride | null) => void;
  addRideRequest: (request: RideRequest) => void;
  removeRideRequest: (requestId: number) => void;
  updateEarnings: (earnings: {
    today: number;
    week: number;
    month: number;
  }) => void;
  clearDriverData: () => void;
}

// Ride Status Sync Types
declare interface RideStatusEvent {
  id: number;
  ride_id: number;
  old_status: string;
  new_status: string;
  changed_by: "driver" | "passenger" | "system";
  changed_by_id: string;
  event_type: "status_change" | "cancellation" | "completion";
  metadata?: any;
  created_at: string;
}

declare interface RideStatusSyncData {
  ride_id: number;
  current_status: string;
  last_status_update: string;
  status_updated_by?: string;
  has_updates: boolean;
  events: RideStatusEvent[];
  driver_location?: {
    latitude: number;
    longitude: number;
    updated_at: string;
  };
}

export interface User {
  id: string;
  phone: string;
  name: string;
  role: string;
  email?: string;
}

export interface AuthStore {
  token: string | null;
  user: User | null;
  hasHydrated: boolean;
  setAuth: (token: string, user: User) => void;
  setHasHydrated: (state: boolean) => void;
  logout: () => void;
}

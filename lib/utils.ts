import { Ride } from "@/types/type";
import { format, toZonedTime } from 'date-fns-tz';
import { formatInTimeZone } from 'date-fns-tz';

// Múi giờ Việt Nam
const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh';

export const sortRides = (rides: Ride[]): Ride[] => {
  const result = rides.sort((a, b) => {
    const dateA = new Date(`${a.created_at}T${a.ride_time}`);
    const dateB = new Date(`${b.created_at}T${b.ride_time}`);
    return dateB.getTime() - dateA.getTime();
  });

  return result.reverse();
};

export function formatTime(minutes: number): string {
  const formattedMinutes = Math.round(minutes) || 0;

  if (formattedMinutes < 60) {
    return `${formattedMinutes} phút`;
  } else {
    const hours = Math.floor(formattedMinutes / 60);
    const remainingMinutes = formattedMinutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate();
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();

  return `${day < 10 ? "0" + day : day} ${month} ${year}`;
}


export function formatDateVN(dateString: string): string {
  try {
    const date = new Date(dateString);
    return formatInTimeZone(date, VIETNAM_TIMEZONE, 'dd/MM/yyyy');
  } catch (error) {
    return dateString;
  }
}

export function formatTimeVN(minutes: number): string {
  if (minutes > 1000000) {
    try {
      const date = new Date(minutes);
      return formatInTimeZone(date, VIETNAM_TIMEZONE, 'HH:mm');
    } catch (error) {
    }
  }

  // Otherwise treat as minutes
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}`;
}

export function formatCurrency(amount: string | number): string {
  const exchangeRate = 24000;
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  const vndAmount = Math.round(numericAmount * exchangeRate);
  return vndAmount.toLocaleString('vi-VN');
}

export function convertVNDToUSD(vndAmount: string | number): number {
  const exchangeRate = 24000;
  const numericAmount = typeof vndAmount === 'string' ? parseFloat(vndAmount) : vndAmount;
  return numericAmount / exchangeRate;
}

export function getVietnamTime(): string {
  return new Date().toISOString();
}

export function getVietnamTimeFormatted(): string {
  const now = new Date();
  return formatInTimeZone(now, VIETNAM_TIMEZONE, 'yyyy-MM-dd HH:mm:ss (O)');
}

export function getVietnamTimeAsUTC(): string {
  return new Date().toISOString();
}

export function toVietnamTime(dateString: string): Date {
  const date = new Date(dateString);
  return toZonedTime(date, VIETNAM_TIMEZONE);
}

export function formatDateTimeVN(dateString: string): string {
  try {
    const date = new Date(dateString);
    return formatInTimeZone(date, VIETNAM_TIMEZONE, 'dd/MM/yyyy HH:mm');
  } catch (error) {
    return dateString;
  }
}
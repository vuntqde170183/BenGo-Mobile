import { useEffect, useRef, useState } from "react";
import RideStatusPoller from "@/services/rideStatusPoller";
import { pushNotificationService } from "@/services/pushNotificationService";
import type { RideStatusSyncData } from "@/types/type";

interface UseRideStatusSyncOptions {
  rideId: number;
  enabled: boolean;
  pollingInterval?: number; // default: 3000ms
  onStatusChange?: (data: RideStatusSyncData) => void;
}

export const useRideStatusSync = ({
  rideId,
  enabled,
  pollingInterval = 3000,
  onStatusChange,
}: UseRideStatusSyncOptions) => {
  const pollerRef = useRef<RideStatusPoller | null>(null);
  const [lastUpdate, setLastUpdate] = useState<RideStatusSyncData | null>(
    null
  );
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    if (!enabled || !rideId) {
      // Stop polling if disabled or no ride ID
      if (pollerRef.current) {
        pollerRef.current.stop();
        setIsPolling(false);
      }
      return;
    }

    pollerRef.current = new RideStatusPoller({
      rideId,
      interval: pollingInterval,
      onUpdate: (data) => {
        setLastUpdate(data);
        onStatusChange?.(data);
      },
      onError: (error) => {
        console.log("[RideStatusSync] Error:", error);
      },
    });

    pollerRef.current.start();
    setIsPolling(true);

    const notificationListener =
      pushNotificationService.addNotificationListener((notification) => {
        const notificationData = notification.request.content.data;
        if (notificationData?.ride_id === rideId) {
          if (pollerRef.current) {
            (pollerRef.current as any).poll?.();
          }
        }
      });

    return () => {
      pollerRef.current?.stop();
      setIsPolling(false);
      notificationListener.remove();
    };
  }, [rideId, enabled, pollingInterval]);

  return {
    lastUpdate,
    isPolling,
  };
};

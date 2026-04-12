import { fetchAPI } from "@/lib/fetch";
import type { RideStatusSyncData } from "@/types/type";

interface RideStatusPollerConfig {
  rideId: number;
  interval: number; // milliseconds
  onUpdate: (data: RideStatusSyncData) => void;
  onError?: (error: any) => void;
}

class RideStatusPoller {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private lastCheck: string = new Date().toISOString();
  private config: RideStatusPollerConfig;
  private isRunning: boolean = false;

  constructor(config: RideStatusPollerConfig) {
    this.config = config;
  }

  start() {
    if (this.intervalId) {
      return;
    }
    this.isRunning = true;
    this.poll();

    this.intervalId = setInterval(() => {
      if (this.isRunning) {
        this.poll();
      }
    }, this.config.interval);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
    }
  }

  private async poll() {
    try {
      const response = await fetchAPI(
        `/(api)/ride/status-sync?ride_id=${this.config.rideId}&last_check=${this.lastCheck}`,
        { method: "GET" }
      );

      if (response.success && response.data.has_updates) {
        this.lastCheck = new Date().toISOString();
        this.config.onUpdate(response.data);
      }
    } catch (error) {
      this.config.onError?.(error);
    }
  }

  updateInterval(newInterval: number) {
    this.config.interval = newInterval;
    if (this.intervalId) {
      this.stop();
      this.start();
    }
  }

  isPolling(): boolean {
    return this.isRunning;
  }
}

export default RideStatusPoller;

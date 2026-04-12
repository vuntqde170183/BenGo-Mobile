import { fetchAPI } from '@/lib/fetch';
interface RideStatusUpdate {
  ride_id: number;
  current_status: string;
  new_status: string;
  elapsed_time: number;
}

class RideStatusUpdater {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private isRunning = false;
  private updateInterval = 30000;
  start() {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    // Run immediately
    this.checkAndUpdateStatuses();

    // Then run periodically
    this.intervalId = setInterval(() => {
      this.checkAndUpdateStatuses();
    }, this.updateInterval);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
    }
  }

  private async checkAndUpdateStatuses() {
    try {
      const response = await fetchAPI('/(api)/ride/update-status', {
        method: 'GET',
      });

      if (!response.success) {
        return;
      }

      const { rides } = response.data;

      for (const ride of rides.toDriverArrived || []) {
        await this.updateRideStatus(ride.ride_id, 'driver_arrived');
      }

      for (const ride of rides.toInProgress || []) {
        await this.updateRideStatus(ride.ride_id, 'in_progress');
      }

      for (const ride of rides.toCompleted || []) {
        await this.updateRideStatus(ride.ride_id, 'completed');
      }
    } catch (error) {
    }
  }

  private async updateRideStatus(ride_id: number, new_status: string) {
    try {
      await fetchAPI('/(api)/ride/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ride_id,
          new_status,
          changed_by: 'system',
          changed_by_id: 'auto-updater',
        }),
      });
    } catch (error) {
    }
  }

  isActive() {
    return this.isRunning;
  }
}

export const rideStatusUpdater = new RideStatusUpdater();

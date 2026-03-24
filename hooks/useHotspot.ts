import { useState, useCallback } from 'react';
import { predictHotspots, HotspotLocation, HotspotResponse } from '@/api/hotspot';

interface UseHotspotReturn {
  hotspots: HotspotLocation[];
  summary: string;
  isLoading: boolean;
  error: string | null;
  analyzedAt: string | null;
  fetchHotspots: (latitude: number, longitude: number, radius?: number) => Promise<void>;
  clearHotspots: () => void;
}

export const useHotspot = (): UseHotspotReturn => {
  const [hotspots, setHotspots] = useState<HotspotLocation[]>([]);
  const [summary, setSummary] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyzedAt, setAnalyzedAt] = useState<string | null>(null);

  const fetchHotspots = useCallback(async (latitude: number, longitude: number, radius: number = 5) => {
    setIsLoading(true);
    setError(null);

    try {
      const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('Thiếu OPENAI API KEY. Vui lòng thêm EXPO_PUBLIC_OPENAI_API_KEY vào file .env');
      }

      const response = await predictHotspots({ latitude, longitude, radius }, apiKey);
      setHotspots(response.locations);
      setSummary(response.summary);
      setAnalyzedAt(response.analyzedAt);
    } catch (err: any) {
      console.error('Hotspot fetch error:', err);
      setError(err.message || 'Không thể dự đoán địa điểm. Vui lòng thử lại.');
      setHotspots([]);
      setSummary('');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearHotspots = useCallback(() => {
    setHotspots([]);
    setSummary('');
    setError(null);
    setAnalyzedAt(null);
  }, []);

  return {
    hotspots,
    summary,
    isLoading,
    error,
    analyzedAt,
    fetchHotspots,
    clearHotspots,
  };
};

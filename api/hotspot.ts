import Constants from "expo-constants";
import { z } from "zod";

// ─── Helpers lấy ENV an toàn ─────────────────────────────────────────────────
const getGoogleApiKey = (): string => {
  const key =
    Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_API_KEY ||
    (Constants.expoConfig as any)?.android?.config?.googleMaps?.apiKey ||
    (Constants.expoConfig as any)?.ios?.config?.googleMapsApiKey;
  if (!key) throw new Error("ENV EXPO_PUBLIC_GOOGLE_API_KEY chưa được cấu hình");
  return key as string;
};

const getOpenWeatherApiKey = (): string => {
  const key = Constants.expoConfig?.extra?.EXPO_PUBLIC_OPENWEATHER_API_KEY;
  if (!key) throw new Error("ENV EXPO_PUBLIC_OPENWEATHER_API_KEY chưa được cấu hình");
  return key as string;
};

// ─── Interface ────────────────────────────────────────────────────────────────

export interface HotspotLocation {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  reason: string;
  crowdLevel: "high" | "medium" | "low";
  estimatedCustomers: string;
  category: string;
  icon: string;
  distanceKm?: number;
}

export interface HotspotRequest {
  latitude: number;
  longitude: number;
  radius?: number; // km
}

export interface HotspotResponse {
  locations: HotspotLocation[];
  summary: string;
  analyzedAt: string;
  weatherContext?: string;
}

// ─── Interface tool searchNearbyHotspots ─────────────────────────────────────

export interface NearbyPlace {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  placeCategory: NearbyCategory;
  types: string[];
  rating?: number;
  isOpenNow?: boolean;
}

export type NearbyCategory =
  | "market"
  | "supermarket"
  | "port"
  | "building_materials"
  | "construction"
  | "export";

export interface NearbyHotspotsResult {
  latitude: number;
  longitude: number;
  radiusKm: number;
  places: NearbyPlace[];
  fetchedAt: string;
}

// ─── Interface tool getWeatherByCoords ───────────────────────────────────────

export interface WeatherData {
  city: string;
  temperature: number;        // °C
  feelsLike: number;          // °C
  humidity: number;           // %
  description: string;        // e.g. "mưa nhẹ"
  windSpeedKmh: number;
  isRaining: boolean;
  isHot: boolean;             // > 35°C
  isCold: boolean;            // < 18°C
  uvIndex?: number;
  visibility?: number;        // km
  fetchedAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** Tọa độ fallback mặc định — chỉ dùng khi caller không truyền tọa độ (ít xảy ra với getWeatherByCoords) */
const DEFAULT_FALLBACK_COORDS = { lat: 16.0544, lng: 108.2022 } as const;

/**
 * Nhóm địa điểm ưu tiên: Chợ, Siêu thị, Cảng, VLXD, Công ty xây dựng, Xuất khẩu.
 * keyword: lọc chính xác hơn qua Google Places keyword param.
 */
const HOTSPOT_CATEGORY_CONFIG: Array<{
  category: NearbyCategory;
  placeTypes: string[];
  label: string;
  keyword?: string;
}> = [
    {
      category: "market",
      placeTypes: ["grocery_or_supermarket"],
      label: "Chợ",
      keyword: "chợ",
    },
    {
      category: "supermarket",
      placeTypes: ["supermarket"],
      label: "Siêu thị / TTTM",
    },
    {
      category: "port",
      placeTypes: ["establishment"],
      label: "Cảng / Bến tàu",
      keyword: "cảng",
    },
    {
      category: "building_materials",
      placeTypes: ["establishment"],
      label: "Cửa hàng vật liệu xây dựng",
      keyword: "vật liệu xây dựng",
    },
    {
      category: "construction",
      placeTypes: ["establishment"],
      label: "Công ty xây dựng",
      keyword: "xây dựng",
    },
    {
      category: "export",
      placeTypes: ["establishment"],
      label: "Công ty xuất khẩu",
      keyword: "xuất khẩu",
    },
  ];

// ─── Filter: Loại bỏ kết quả Google Places không liên quan ──────────────────────────────
/**
 * Google Places đôi khi trả về sai do keyword match theo tên địa điểm.
 * Ví dụ: keyword="cảng" match "Hương Cảng chè quán" (tiệm trà),
 * keyword="xuất khẩu" match "xuất khẩu lao động" (du học).
 * Bộ filter này loại bỏ các kết quả chắc chắn sai trước khi gửi AI.
 */

/** Từ khóa trong tên chỉ ra address/category KHÔNG phải là hotspot giao hàng */
const GLOBAL_IRRELEVANT_NAME_PATTERNS = [
  // Ăn uống không phải địa điểm giao hàng
  /\bqu\u00e1n\b/i, /\bcaf[eé]\b/i, /\bc\u00e0 ph\u00ea\b/i, /\bch\u00e8\b/i,
  /\bnh\u00e0 h\u00e0ng\b/i, /\bm\u00f3n \u0103n\b/i, /\b\u0103n u\u1ed1ng\b/i,
  // Dịch vụ cá nhân
  /\bdu h\u1ecdc\b/i, /\b\u0111\u1ecbnh c\u01b0\b/i, /\bdu l\u1ecbch\b/i, /\bkhach s\u1ea1n\b/i,
  /\btr\u01b0\u1eddng\b/i, /\b\u0111\u1ea1i h\u1ecdc\b/i, /\bthi\u1ebft k\u1ebf\b/i,
  // Cứu hộ / Dịch vụ xe
  /\bc\u1ee9u h\u1ed9\b/i, /\bs\u1eeda xe\b/i, /\bgas\b/i,
];

/** Blacklist thêm riêng cho từng category */
const CATEGORY_EXTRA_EXCLUDE: Record<string, RegExp[]> = {
  port: [
    /\bch\u00e8\b/i, /\bqu\u00e1n\b/i, /\bcaf[eé]\b/i,     // "Hương Cảng chè quán"
    /\bnhi\u00ean li\u1ec7u\b/i,                             // trạm xăng
    /\bn\u00e0o\s+xe\b/i, /\b\u0111\u1eadu\s+xe\b/i,         // bãi đậu xe
    /\bh\u00e0ng\s+kh\u00f4ng\b/i,                           // sân bay (không phải cảng biển)
  ],
  export: [
    /lao\s+\u0111\u1ed9ng/i,                               // xuất khẩu lao động
    /h\u1ecdc\s+(b\u1ed5ng|ngh\u1ec1|vi\u1ec7c)/i,           // du học/h\u1ecdc việc
    /t\u01b0 v\u1ea5n/i,                                   // c\u00f4ng ty t\u01b0 v\u1ea5n
    /vi\u1ec7c\s+l\u00e0m/i,                               // m\u00f4i gi\u1edbi vi\u1ec7c l\u00e0m
    /remote\b/i,                                          // d\u1ecbch v\u1ee5 k\u1ef9 thu\u1eadt
    /c\u1eeda\s+cu\u1ed1n/i,                               // s\u1eeda c\u1eeda cu\u1ed1n
  ],
  supermarket: [
    /kh\u00f3a\s+c\u1eeda/i, /th\u1ee3\s+kh\u00f3a/i,         // ti\u1ec7m kh\u00f3a
    /s\u1eeda\s+ch\u1eefa/i, /b\u1ea3o\s+tr\u00ec/i,         // d\u1ecbch v\u1ee5 s\u1eeda ch\u1eefa
  ],
  building_materials: [
    /th\u1ea9m\s+m\u00fd/i, /spa\b/i, /massage\b/i,       // d\u1ecbch v\u1ee5 l\u00e0m \u0111\u1eb9p
  ],
};

/**
 * Kiểm tra xem địa điểm có liên quan tới việc giao hàng không.
 * Trả về false nếu tên địa điểm chứa các từ khóa chỉ ra sai category.
 */
const isPlaceRelevant = (name: string, category: string): boolean => {
  const lowerName = name.toLowerCase();
  // Kiểm tra global blacklist
  for (const pattern of GLOBAL_IRRELEVANT_NAME_PATTERNS) {
    if (pattern.test(lowerName)) return false;
  }
  // Kiểm tra blacklist riêng của category
  const extra = CATEGORY_EXTRA_EXCLUDE[category];
  if (extra) {
    for (const pattern of extra) {
      if (pattern.test(lowerName)) return false;
    }
  }
  return true;
};

// ─── Zod schema: validate output của AI ─────────────────────────────────────

const AiRankedLocationSchema = z.object({
  id: z.string(),
  reason: z.string().default(""),
  crowdLevel: z.enum(["high", "medium", "low"]).default("medium"),
  estimatedCustomers: z.string().default("Chưa rõ"),
  category: z
    .enum(["market", "supermarket", "port", "building_materials", "construction", "export"])
    .default("market"),
});

const AiRankingResponseSchema = z.object({
  rankedLocations: z.array(AiRankedLocationSchema).default([]),
  summary: z.string().default("Phân tích hoàn tất"),
});

type AiRankedLocation = z.infer<typeof AiRankedLocationSchema>;

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_TO_ICON: Record<string, string> = {
  market: "storefront",
  supermarket: "cart",
  port: "boat",
  building_materials: "construct",
  construction: "hammer",
  export: "cube-outline",
  shopping: "cart",
  food: "restaurant",
  transport: "bus",
  hospital: "medkit",
  entertainment: "game-controller",
  office: "briefcase",
  tourism: "camera",
};

// ─── Util: Haversine distance ─────────────────────────────────────────────────

const haversineKm = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ─── Util: time helpers ───────────────────────────────────────────────────────

const getDayName = (date: Date): string => {
  const days = [
    "Chủ Nhật",
    "Thứ Hai",
    "Thứ Ba",
    "Thứ Tư",
    "Thứ Năm",
    "Thứ Sáu",
    "Thứ Bảy",
  ];
  return days[date.getDay()];
};

const getTimeContext = (date: Date): string => {
  const h = date.getHours();
  if (h >= 5 && h < 9) return "buổi sáng sớm (giờ cao điểm đi làm)";
  if (h >= 9 && h < 11) return "buổi sáng (sau giờ cao điểm)";
  if (h >= 11 && h < 14) return "buổi trưa (giờ ăn trưa)";
  if (h >= 14 && h < 17) return "buổi chiều";
  if (h >= 17 && h < 20) return "buổi chiều tối (giờ cao điểm tan làm)";
  if (h >= 20 && h < 23) return "buổi tối";
  return "khuya";
};

// ─── Util: fetchWithRetry ────────────────────────────────────────────────────
/**
 * Gọi lại tối đa `maxRetry` lần khi mạng lỗi hoặc server trả về 5xx.
 * Delay tăng dần: 300ms, 600ms, ... (exponential backoff nhẹ).
 */
const fetchWithRetry = async (
  fn: () => Promise<Response>,
  maxRetry: number = 2,
  delayMs: number = 300
): Promise<Response> => {
  for (let attempt = 0; attempt <= maxRetry; attempt++) {
    try {
      const res = await fn();
      // Chỉ retry 5xx — 4xx là lỗi client, không nên retry
      if (res.ok || res.status < 500 || attempt === maxRetry) return res;
    } catch (err) {
      if (attempt === maxRetry) throw err;
    }
    await new Promise<void>((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
  }
  // Unreachable nhưng TypeScript cần return
  throw new Error("fetchWithRetry: unexpected exit");
};

// ─── Cache: Google Places results (TTL 5 phút) ───────────────────────────────

const PLACES_CACHE_TTL_MS = 5 * 60 * 1000; // 5 phút

interface PlacesCacheEntry {
  data: NearbyHotspotsResult;
  expiry: number;
}

const placesCache = new Map<string, PlacesCacheEntry>();

// ─── Cache: Weather (TTL 10 phút) ───────────────────────────────────────────

const WEATHER_CACHE_TTL_MS = 10 * 60 * 1000; // 10 phút

interface WeatherCacheEntry {
  data: WeatherData;
  expiry: number;
}

/** Cache weather theo tọa độ (làm tròn 2 chữ số thập phân ~1.1km) */
const weatherCache = new Map<string, WeatherCacheEntry>();

const getWeatherCacheKey = (lat: number, lng: number): string =>
  `${lat.toFixed(2)}_${lng.toFixed(2)}`;

/** Key cache Google Places làm tròn 3 chữ số thập phân (~110m sai số) */
const getPlacesCacheKey = (lat: number, lng: number, radiusKm: number): string =>
  `${lat.toFixed(3)}_${lng.toFixed(3)}_${radiusKm}`;

// ─── Util: fetch một nhóm địa điểm từ Google Places ─────────────────────────
/**
 * Fetch tất cả địa điểm thuộc một category từ Google Places Nearby Search.
 * Hàm này được gọi song song cho 6 category thông qua Promise.allSettled.
 */
const fetchCategoryPlaces = async (
  config: (typeof HOTSPOT_CATEGORY_CONFIG)[number],
  latitude: number,
  longitude: number,
  radiusMeters: number,
  googleApiKey: string
): Promise<NearbyPlace[]> => {
  const primaryType = config.placeTypes[0];
  const keywordParam = config.keyword
    ? `&keyword=${encodeURIComponent(config.keyword)}`
    : "";
  const url =
    `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
    `?location=${latitude},${longitude}` +
    `&radius=${radiusMeters}` +
    `&type=${primaryType}` +
    `${keywordParam}` +
    `&language=vi` +
    `&key=${googleApiKey}`;

  __DEV__ && console.log(
    `🗺️ [GGMap] Request: ${config.label} (type=${primaryType}${config.keyword ? `, keyword=${config.keyword}` : ""})`
  );

  // #7: retry tối đa 2 lần khi mạng lỗi hoặc 5xx
  const res = await fetchWithRetry(() => fetch(url));

  if (!res.ok) {
    throw new Error(`Google Places API HTTP ${res.status}`);
  }

  const data = await res.json();

  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    throw new Error(`Google Places API: ${data.status} - ${data.error_message ?? ""}`);
  }

  const results: any[] = data.results ?? [];

  // Lọc bỏ kết quả không liên quan (tiệm cà phê, du học lạc vào...)
  const filtered = results.filter((place) =>
    isPlaceRelevant((place.name ?? "") as string, config.category)
  );
  const removedCount = results.length - filtered.length;
  __DEV__ && console.log(
    `🗺️ [GGMap] Response: ${config.label} → ${results.length} kết quả` +
    (removedCount > 0 ? ` (−${removedCount} bị lọc)` : "")
  );

  return filtered.map((place) => ({
    id: place.place_id as string,
    name: (place.name ?? "Không rõ tên") as string,
    address: (place.vicinity ?? place.formatted_address ?? "") as string,
    latitude: place.geometry.location.lat as number,
    longitude: place.geometry.location.lng as number,
    distanceKm: 0, // được tính chính xác sau khi merge
    placeCategory: config.category,
    types: (place.types ?? []) as string[],
    rating: place.rating as number | undefined,
    isOpenNow: place.opening_hours?.open_now as boolean | undefined,
  }));
};

// ─── TOOL 1: searchNearbyHotspots ─────────────────────────────────────────────
/**
 * Tìm kiếm các điểm hotspot xung quanh vị trí hiện tại thông qua Google Places API.
 *
 * Tìm 6 nhóm địa điểm: Chợ, Siêu thị, Cảng, VLXD, Xây dựng.
 * Mỗi nhóm được fetch SONG SONG (Promise.allSettled) — giảm ~80% latency so với tuần tự.
 * Kết quả được CACHE 5 phút để tránh gọi lại API khi tài xế không di chuyển.
 *
 * @param latitude - Vĩ độ vị trí hiện tại
 * @param longitude - Kinh độ vị trí hiện tại
 * @param radiusKm - Bán kính tìm kiếm (mặc định 10km, tối đa 50km)
 */
export const searchNearbyHotspots = async (
  latitude: number,
  longitude: number,
  radiusKm: number = 10
): Promise<NearbyHotspotsResult> => {
  if (!latitude || !longitude) {
    throw new Error("Vị trí không hợp lệ: latitude và longitude là bắt buộc");
  }

  // ── Check cache trước khi gọi API ────────────────────────────────────────
  const cacheKey = getPlacesCacheKey(latitude, longitude, radiusKm);
  const cached = placesCache.get(cacheKey);
  if (cached && Date.now() < cached.expiry) {
    __DEV__ && console.log(
      `🗺️ [Hotspot] Cache hit → ${cached.data.places.length} địa điểm (còn ${Math.round((cached.expiry - Date.now()) / 1000)}s)`
    );
    return cached.data;
  }

  const googleApiKey = getGoogleApiKey();
  const radiusMeters = Math.min(radiusKm * 1000, 50000);

  __DEV__ && console.log(
    `🗺️ [Hotspot] Bắt đầu tìm địa điểm — tọa độ: ${latitude}, ${longitude} | bán kính: ${radiusKm}km | ${HOTSPOT_CATEGORY_CONFIG.length} nhóm (song song)`
  );

  // ── Gọi 6 nhóm song song ─────────────────────────────────────────────────
  const settled = await Promise.allSettled(
    HOTSPOT_CATEGORY_CONFIG.map((config) =>
      fetchCategoryPlaces(config, latitude, longitude, radiusMeters, googleApiKey)
    )
  );

  // ── Merge kết quả + dedup bằng place_id ─────────────────────────────────
  const seenIds = new Set<string>();
  const allPlaces: NearbyPlace[] = [];

  for (let i = 0; i < settled.length; i++) {
    const settlement = settled[i];
    const config = HOTSPOT_CATEGORY_CONFIG[i];

    if (settlement.status === "rejected") {
      const reason = settlement.reason;
      __DEV__ && console.warn(`🗺️ [GGMap] Lỗi nhóm "${config.label}": ${reason?.message ?? reason}`);
      throw new Error(`Lỗi tìm kiếm nhóm "${config.label}": ${reason?.message ?? reason}`);
    }

    for (const place of settlement.value) {
      if (seenIds.has(place.id)) continue;
      seenIds.add(place.id);
      allPlaces.push({
        ...place,
        distanceKm:
          Math.round(haversineKm(latitude, longitude, place.latitude, place.longitude) * 100) / 100,
      });
    }
  }

  __DEV__ && console.log(`🗺️ [Hotspot] Hoàn thành tìm địa điểm → tổng ${allPlaces.length} nơi (sau khi loại trùng)`);

  const nearbyResult: NearbyHotspotsResult = {
    latitude,
    longitude,
    radiusKm,
    places: allPlaces,
    fetchedAt: new Date().toISOString(),
  };

  // ── Lưu vào cache ────────────────────────────────────────────────────────
  placesCache.set(cacheKey, { data: nearbyResult, expiry: Date.now() + PLACES_CACHE_TTL_MS });

  return nearbyResult;
};

// ─── TOOL 2: getWeatherByCoords ──────────────────────────────────────────────
/**
 * Lấy dữ liệu thời tiết thực tế theo tọa độ từ OpenWeatherMap API.
 * Kết quả được cache 10 phút theo tọa độ (~1.1km precision).
 *
 * Tọa độ hoàn toàn động theo vị trí tài xế — không hardcode địa danh cụ thể.
 * Trả về nhiệt độ, độ ẩm, mô tả thời tiết, tốc độ gió, isRaining, isHot, isCold.
 */
export const getWeatherByCoords = async (
  lat: number = DEFAULT_FALLBACK_COORDS.lat,
  lng: number = DEFAULT_FALLBACK_COORDS.lng
): Promise<WeatherData> => {
  // #4: Kiểm tra cache trước
  const cacheKey = getWeatherCacheKey(lat, lng);
  const cached = weatherCache.get(cacheKey);
  if (cached && Date.now() < cached.expiry) {
    __DEV__ && console.log(
      `☁️ [Weather] Cache hit → ${cached.data.description} ${cached.data.temperature}°C (còn ${Math.round((cached.expiry - Date.now()) / 1000)}s)`
    );
    return cached.data;
  }

  const owApiKey = getOpenWeatherApiKey();
  const url =
    `https://api.openweathermap.org/data/2.5/weather` +
    `?lat=${lat}&lon=${lng}` +
    `&appid=${owApiKey}&units=metric&lang=vi`;

  __DEV__ && console.log(`☁️ [Weather] Request: OpenWeatherMap (${lat}, ${lng})`);

  // #7: retry tối đa 2 lần
  const res = await fetchWithRetry(() => fetch(url));

  if (!res.ok) {
    const errText = await res.text();
    __DEV__ && console.warn(`☁️ [Weather] Lỗi HTTP ${res.status}: ${errText.substring(0, 100)}`);
    throw new Error(`OpenWeatherMap API lỗi ${res.status}: ${errText.substring(0, 200)}`);
  }

  const data = await res.json();

  if (!data.main) {
    __DEV__ && console.warn(`☁️ [Weather] Dữ liệu không hợp lệ:`, JSON.stringify(data).substring(0, 100));
    throw new Error("OpenWeatherMap trả về dữ liệu không hợp lệ");
  }

  const windSpeedKmh = Math.round((data.wind?.speed ?? 0) * 3.6 * 10) / 10;
  const temp: number = data.main.temp;
  const feelsLike: number = data.main.feels_like;
  const humidity: number = data.main.humidity;
  const description: string = data.weather?.[0]?.description ?? "";
  const weatherId: number = data.weather?.[0]?.id ?? 0;

  const isRaining = weatherId >= 200 && weatherId < 700;
  const isHot = temp > 35;
  const isCold = temp < 18;

  const result: WeatherData = {
    city: data.name ?? "",
    temperature: Math.round(temp * 10) / 10,
    feelsLike: Math.round(feelsLike * 10) / 10,
    humidity,
    description,
    windSpeedKmh,
    isRaining,
    isHot,
    isCold,
    uvIndex: data.uvi,
    visibility: data.visibility != null ? Math.round(data.visibility / 100) / 10 : undefined,
    fetchedAt: new Date().toISOString(),
  };

  // Lưu cache 10 phút
  weatherCache.set(cacheKey, { data: result, expiry: Date.now() + WEATHER_CACHE_TTL_MS });

  return result;
};

/** @deprecated Dùng getWeatherByCoords() thay thế */
export const getDanangWeatherForecast = (): Promise<WeatherData> =>
  getWeatherByCoords(DEFAULT_FALLBACK_COORDS.lat, DEFAULT_FALLBACK_COORDS.lng);

// ─── buildAiRankingPrompt ─────────────────────────────────────────────────────
/**
 * Tạo system prompt cho AI xếp hạng hotspot.
 * App giao hàng vận chuyển gồm: xe máy (hàng nhỏ), xe van (hàng vừa), xe tải (hàng nặng).
 * @param maxResults - Số địa điểm tối đa cần chọn
 * @param cityContext - Mô tả khu vực địa lý từ tọa độ thực của tài xế
 */
const buildAiRankingPrompt = (maxResults: number, cityContext: string): string => `
Bạn là trợ lý AI phân tích điểm hotspot cho tài xế giao hàng vận chuyển.
Khu vực phân tích: ${cityContext}

LOẠI PHƯƠNG TIỆN & PHÙ HỢP:
- Xe máy: Hàng nhỏ (tài liệu, thức ăn, đồ điện tử nhỏ, quà tặng). Phù hợp: chợ, siêu thị, cửa hàng bán lẻ.
- Xe van: Hàng vừa (thiết bị gia dụng, nội thất nhỏ, hàng thương mại). Phù hợp: siêu thị lớn, TTTM, kho hàng.
- Xe tải: Hàng nặng / cồng kềnh (vật liệu xây dựng, container, xuất khẩu). Phù hợp: cảng, kho VLXD, công trường, công ty xuất khẩu.

NHIỆM VỤ: Dựa trên vị trí, thời tiết và thời điểm, hãy chọn ra ĐÚNG ${maxResults} địa điểm có nhiều khả năng phát sinh đơn vận chuyển (cho cả 3 loại xe) nhất. Nếu địa điểm ít hơn ${maxResults} thì trả về tất cả.

THỨ TỰ ƯU TIÊN (từ cao đến thấp):
1. Siêu thị / TTTM — đơn xe máy & xe van cao ổn định cả ngày; tăng mạnh cuối tuần và khi mưa.
2. Chợ — đơn xe máy cao sáng sớm (5–9h) và trưa (11–13h); hàng tươi sống, nhu yếu phẩm.
3. Cảng / Bến tàu — đơn xe tải cao sáng sớm và chiều (theo lịch tàu); hàng container, xuất nhập khẩu.
4. Cửa hàng vật liệu xây dựng — đơn xe tải cao buổi sáng (7–11h) và đầu chiều (13–16h).
5. Công ty xây dựng — đơn xe tải/van cao giờ trưa (11–13h) và tan ca (17–19h).
6. Công ty xuất khẩu — đơn xe tải cao theo giờ hành chính.

QUY TẮC BẮT BUỘC:
- PHẢI dùng đúng giá trị "id" trong [] của từng dòng danh sách, không tự tạo id mới.
- CHỈ sử dụng địa điểm có sẵn trong danh sách. KHÔNG tự thêm địa điểm mới.
- KHÔNG đưa nhà hàng, khách sạn, trường học, bệnh viện vào kết quả.
- Nếu trời mưa: tăng ưu tiên siêu thị và chợ; giảm địa điểm ngoài trời.
- Nếu giờ tan tầm (17–20h): tăng ưu tiên chợ, TTTM, xây dựng, xuất khẩu.
- Thứ Bảy, Chủ Nhật: siêu thị & chợ đông hơn; xây dựng & xuất khẩu ít đơn hơn.
- "reason" phải nêu rõ loại hàng hóa cụ thể và loại xe phù hợp (không chung chung).

Trả về JSON thuần (KHÔNG markdown):
{
  "rankedLocations": [
    {
      "id": "giá trị id trong [] của địa điểm",
      "reason": "Lý do cụ thể: loại hàng hóa, loại xe phù hợp và khả năng có đơn tại thời điểm này (1–2 câu)",
      "crowdLevel": "high|medium|low",
      "estimatedCustomers": "Ước tính số đơn vận chuyển (ví dụ: 5–10 đơn/giờ)",
      "category": "market|supermarket|port|building_materials|construction|export"
    }
  ],
  "summary": "Tóm tắt ngắn tiềm năng đơn hàng vận chuyển khu vực theo thời điểm, thời tiết và loại xe phù hợp"
}
`.trim();


// ─── Util: ánh xạ bán kính → số kết quả tối đa trả về ────────────────────────────────
/**
 * 3km → 3 | 5km → 6 | 10km → 11 | 15km → 20
 * Radius khác: nội suy tuyến tính, tối thiểu 3.
 */
const getMaxResultsByRadius = (radiusKm: number): number => {
  if (radiusKm <= 3) return 3;
  if (radiusKm <= 5) return 6;
  if (radiusKm <= 10) return 11;
  return 20; // 15km+
};

// ─── predictHotspots (main export) ───────────────────────────────────────────
/**
 * Phân tích và dự đoán các điểm hotspot có nhiều đơn vận chuyển nhất.
 * Số kết quả tối đa phụ thuộc vào bán kính: 3km→3 | 5km→6 | 10km→11 | 15km→20.
 *
 * Quy trình:
 * 1. Gọi searchNearbyHotspots → lấy địa điểm thực tế (chợ, siêu thị, cảng, VLXD, xây dựng, xuất khẩu)
 * 2. Gọi getWeatherByCoords → lấy thời tiết theo tọa độ thực của tài xế
 * 3. Kết hợp vị trí + thời tiết + thời gian → AI xếp hạng các vị trí tốt nhất
 *
 * @param request - Vị trí hiện tại và bán kính tìm kiếm
 * @param openaiApiKey - OpenAI API key
 */
/** #9: Validate tọa độ địa lý chặt chẽ — tránh falsy check sai với lat=0 */
const isValidCoord = (lat: number, lng: number): boolean =>
  Number.isFinite(lat) && Number.isFinite(lng) &&
  lat >= -90 && lat <= 90 &&
  lng >= -180 && lng <= 180;

export const predictHotspots = async (
  request: HotspotRequest,
  openaiApiKey: string
): Promise<HotspotResponse> => {
  if (!isValidCoord(request.latitude, request.longitude)) {
    throw new Error("Vị trí không hợp lệ: latitude phải trong [-90,90] và longitude trong [-180,180]");
  }

  if (!openaiApiKey?.trim()) {
    throw new Error("openaiApiKey là bắt buộc");
  }

  const now = new Date();
  const dayName = getDayName(now);
  const timeContext = getTimeContext(now);
  const timeStr = now.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const isWeekend = now.getDay() === 0 || now.getDay() === 6;
  const radiusKm = request.radius ?? 10;
  const maxResults = getMaxResultsByRadius(radiusKm);

  __DEV__ && console.log(`🔥 [Hotspot] Bán kính ${radiusKm}km → tối đa ${maxResults} kết quả`);

  // ── Bước 1 & 2: Song song lấy địa điểm (Google Places) và thời tiết ────────
  // searchNearbyHotspots và getWeatherByCoords hoàn toàn độc lập → chạy đồng thời
  // Tọa độ hoàn toàn động theo vị trí tài xế — không phụ thuộc địa danh cụ thể
  const [nearbyResult, weatherRaw] = await Promise.all([
    searchNearbyHotspots(request.latitude, request.longitude, radiusKm),
    getWeatherByCoords(request.latitude, request.longitude).catch((err: unknown) => {
      // Thời tiết thất bại không chặn toàn bộ quy trình
      __DEV__ && console.warn(
        `☁️ [Weather] Lỗi: ${err instanceof Error ? err.message : String(err)}`
      );
      return null;
    }),
  ]);

  if (nearbyResult.places.length === 0) {
    throw new Error(
      "Không tìm thấy địa điểm nào trong khu vực. Vui lòng tăng bán kính tìm kiếm."
    );
  }

  // ── Xử lý kết quả thời tiết ──────────────────────────────────────────────
  const weather: WeatherData | null = weatherRaw;
  let weatherContext = "";

  if (weather) {
    weatherContext =
      `Thời tiết hiện tại: ${weather.description}, ` +
      `nhiệt độ ${weather.temperature}°C (cảm giác ${weather.feelsLike}°C), ` +
      `độ ẩm ${weather.humidity}%, ` +
      `gió ${weather.windSpeedKmh} km/h` +
      (weather.isRaining ? " — ĐANG MƯA" : "") +
      (weather.isHot ? " — NẮNG NÓNG" : "") +
      (weather.isCold ? " — TRỜI LẠNH" : "");
  } else {
    weatherContext = "Không lấy được dữ liệu thời tiết";
  }

  // ── Bước 3: Lọc + chọn đại diện từng nhóm + build prompt cho AI ────────
  // Lấy top 3 địa điểm gần nhất PER CATEGORY để AI có đủ đa dạng, tránh bị dominated bởi 1 nhóm
  const TOP_PER_CATEGORY = 3;
  const byCategory = new Map<string, typeof nearbyResult.places>();
  for (const place of nearbyResult.places) {
    if (place.isOpenNow === false) continue; // #8: bỏ đóng cửa xác định
    const key = place.placeCategory;
    if (!byCategory.has(key)) byCategory.set(key, []);
    byCategory.get(key)!.push(place);
  }
  // Sort từng nhóm theo khoảng cách, lấy top 3
  const placesForAi: typeof nearbyResult.places = [];
  for (const [, places] of byCategory) {
    const sorted = places.slice().sort((a, b) => a.distanceKm - b.distanceKm);
    placesForAi.push(...sorted.slice(0, TOP_PER_CATEGORY));
  }
  // Sort cuối: theo category priority rồi distance
  const CATEGORY_PRIORITY: Record<string, number> = {
    supermarket: 1, market: 2, port: 3,
    building_materials: 4, construction: 5, export: 6,
  };
  placesForAi.sort((a, b) => {
    const pa = CATEGORY_PRIORITY[a.placeCategory] ?? 99;
    const pb = CATEGORY_PRIORITY[b.placeCategory] ?? 99;
    return pa !== pb ? pa - pb : a.distanceKm - b.distanceKm;
  });

  // Context địa lý: tên thành phố từ OpenWeatherMap hoặc tọa độ thực
  const cityContext = weather?.city
    ? `gần ${weather.city} (${request.latitude.toFixed(4)}, ${request.longitude.toFixed(4)})`
    : `tọa độ ${request.latitude.toFixed(4)}, ${request.longitude.toFixed(4)}`;

  // Format gửi AI: bao gồm địa chỉ để AI phân biệt đúng địa điểm
  const placesListStr = placesForAi
    .map((p, i) => {
      const categoryLabel =
        HOTSPOT_CATEGORY_CONFIG.find((c) => c.category === p.placeCategory)
          ?.label ?? p.placeCategory;
      const openStatus = p.isOpenNow === true ? " [Mở cửa]" : "";
      return (
        `${i + 1}. [${p.id}] ${p.name}${openStatus}\n` +
        `   Nhóm: ${categoryLabel} | Cách: ${p.distanceKm}km` +
        (p.rating != null ? ` | ★${p.rating}` : "") + `\n` +
        `   Địa chỉ: ${p.address || "Không rõ"}`
      );
    })
    .join("\n");

  const userPrompt =
    `Thời gian: ${timeStr} — ${timeContext} | ${dayName}${isWeekend ? " (Cuối tuần)" : ""}\n` +
    `${weatherContext}\n` +
    `Khu vực: ${cityContext} | Bán kính: ${radiusKm}km\n` +
    `Địa điểm phân tích: ${placesForAi.length} (lọc từ ${nearbyResult.places.length} tổng)\n\n` +
    `Danh sách địa điểm:\n${placesListStr}\n\n` +
    `Chọn ĐÚNG ${maxResults} địa điểm có tiềm năng đơn vận chuyển cao nhất tại ${timeStr} ${dayName}. ` +
    `Ưu tiên: Siêu thị > Chợ > Cảng > VLXD > Xây dựng > Xuất khẩu.`;

  __DEV__ && console.log(
    `🤖 [AI Prompt] System (${buildAiRankingPrompt(maxResults, cityContext).length} chars) | User (${userPrompt.length} chars)\n` +
    `Gửi ${placesForAi.length} địa điểm (${[...byCategory.keys()].join(", ")})`
  );
  __DEV__ && console.log(`🤖 [AI UserPrompt]\n${userPrompt}`);


  // ── Bước 4: Gửi AI phân tích ─────────────────────────────────────────────
  // #6: response_format json_object → OpenAI đảm bảo output luôn là JSON hợp lệ
  // #7: fetchWithRetry cho OpenAI
  const aiResponse = await fetchWithRetry(() =>
    fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: buildAiRankingPrompt(maxResults, cityContext) },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    })
  );

  if (!aiResponse.ok) {
    const errText = await aiResponse.text();
    throw new Error(
      `OpenAI API lỗi ${aiResponse.status}: ${errText.substring(0, 300)}`
    );
  }

  const aiData = await aiResponse.json();
  const content: string | undefined = aiData.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Không nhận được phản hồi từ AI");
  }

  // DEBUG: log toàn bộ nội dung AI trả về để kiểm tra chất lượng
  __DEV__ && console.log(`🤖 [AI Response] tokens=${aiData.usage?.total_tokens ?? "?"} | content:\n${content}`);

  // ── Bước 5: Parse JSON — response_format json_object đảm bảo luôn hợp lệ ──
  let rawJson: unknown;
  try {
    rawJson = JSON.parse(content);
  } catch {
    throw new Error(`AI trả về JSON không hợp lệ: ${content.substring(0, 200)}`);
  }

  // ── Bước 6: Validate cấu trúc output bằng Zod ────────────────────────────
  const zodResult = AiRankingResponseSchema.safeParse(rawJson);
  if (!zodResult.success) {
    throw new Error(
      `AI trả về dữ liệu không đúng định dạng: ${zodResult.error.message}`
    );
  }
  const parsed = zodResult.data;

  __DEV__ && console.log(
    `🤖 [AI Ranked] ${parsed.rankedLocations.length} địa điểm được chọn:\n` +
    parsed.rankedLocations.map((r, i) => {
      const match = nearbyResult.places.find((p) => p.id === r.id);
      return `  ${i + 1}. [${r.crowdLevel}] id=${r.id} → ${match ? `✅ ${match.name}` : "❌ KHÔNG MATCH"}`;
    }).join("\n")
  );

  // ── Bước 7: Map tọa độ thực tế từ Google Places → không tin tọa độ AI ────
  const rankedLocations: HotspotLocation[] = parsed.rankedLocations
    .flatMap((ranked: AiRankedLocation): HotspotLocation[] => {
      const realPlace = nearbyResult.places.find((p) => p.id === ranked.id);
      if (!realPlace) return [];


      const category: string = ranked.category ?? realPlace.placeCategory;
      const icon: string = CATEGORY_TO_ICON[category] ?? "location";

      const location: HotspotLocation = {
        id: realPlace.id,
        name: realPlace.name,
        address: realPlace.address,
        latitude: realPlace.latitude,  // Tọa độ thực tế từ Google, không dùng AI
        longitude: realPlace.longitude,
        reason: ranked.reason,
        crowdLevel: ranked.crowdLevel,
        estimatedCustomers: ranked.estimatedCustomers,
        category,
        icon,
        distanceKm: realPlace.distanceKm,
      };
      return [location];
    })
    .slice(0, maxResults); // Giới hạn theo bán kính: 3km→3 | 5km→6 | 10km→11 | 15km→20

  return {
    locations: rankedLocations,
    summary: parsed.summary ?? "Phân tích hoàn tất",
    analyzedAt: now.toISOString(),
    weatherContext: weatherContext || undefined,
  };
};

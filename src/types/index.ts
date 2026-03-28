// Araç sınıfları
export type VehicleClass = "1" | "2" | "3" | "4" | "5" | "moto";

export const VEHICLE_CLASS_LABELS: Record<VehicleClass, string> = {
  "1": "1. Sınıf (Otomobil)",
  "2": "2. Sınıf (Minibüs)",
  "3": "3. Sınıf (Otobüs / Kamyon)",
  "4": "4. Sınıf (Ağır Kamyon)",
  "5": "5. Sınıf (Çok Ağır Kamyon)",
  moto: "Motosiklet",
};

// Geçiş noktası türleri
export type TollPointType = "gise" | "bridge" | "tunnel" | "ferry";

export const TOLL_TYPE_LABELS: Record<TollPointType, string> = {
  gise: "Gişe",
  bridge: "Köprü",
  tunnel: "Tünel",
  ferry: "Feribot",
};

// Gişe / Geçiş noktası
export interface TollPlaza {
  id: string;
  name: string;
  otoyol?: string; // O-4, O-5 vb. (sadece gişeler için)
  lat: number;
  lng: number;
  type: TollPointType;
  km?: number; // Otoyol üzerindeki km bilgisi
}

// Sabit ücretli geçişler (köprü, tünel, feribot)
export interface FixedToll {
  id: string;
  name: string;
  type: TollPointType;
  operator: string;
  description: string;
  start: [number, number]; // [lat, lng]
  end: [number, number];
  prices: Record<VehicleClass, number>;
  nightDiscount?: {
    enabled: boolean;
    percentage?: number;
    startHour?: number;
    endHour?: number;
  };
  active: boolean;
}

// Otoyol gişe-gişe ücret
export interface OtoyolPricing {
  [otoyol: string]: {
    [entryExit: string]: Record<VehicleClass, number>;
  };
}

// Konum (şehir/ilçe)
export interface Location {
  id: string;
  name: string;
  il: string;
  lat: number;
  lng: number;
  popular?: boolean;
}

// Popüler rota
export interface PopularRoute {
  from: string;
  to: string;
  slug: string;
  totalDistanceKm: number;
  tolls: TollOnRoute[];
  totalPrices: Record<VehicleClass, number>;
  waypoints: [number, number][];
}

// Rota üzerindeki geçiş
export interface TollOnRoute {
  id: string;
  name: string;
  type: TollPointType;
  prices: Record<VehicleClass, number>;
  km?: number;
}

// Rota hesaplama sonucu
export interface RouteCalculationResult {
  from: Location;
  to: Location;
  totalDistanceKm: number;
  tolls: TollOnRoute[];
  totalPrices: Record<VehicleClass, number>;
  waypoints: [number, number][];
}

// Site ayarları
export interface SiteSettings {
  siteName: string;
  siteDescription: string;
  lastPriceUpdate: string;
  announcement: string;
  adsEnabled: boolean;
  googleAnalyticsId: string;
  seoDefaults: {
    titleSuffix: string;
  };
}

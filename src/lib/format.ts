import type { VehicleClass } from "@/types";

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace("₺", "")
    .trim() + " TL";
}

export function formatDistance(km: number): string {
  return `${km} km`;
}

export function getVehicleClassLabel(vehicleClass: VehicleClass): string {
  const labels: Record<VehicleClass, string> = {
    "1": "1. Sınıf (Otomobil)",
    "2": "2. Sınıf (Minibüs)",
    "3": "3. Sınıf (Otobüs/Kamyon)",
    "4": "4. Sınıf (Ağır Kamyon)",
    "5": "5. Sınıf (Çok Ağır Kamyon)",
    moto: "Motosiklet",
  };
  return labels[vehicleClass];
}

export function getVehicleClassShortLabel(vehicleClass: VehicleClass): string {
  const labels: Record<VehicleClass, string> = {
    "1": "Otomobil",
    "2": "Minibüs",
    "3": "Otobüs/Kamyon",
    "4": "Ağır Kamyon",
    "5": "Çok Ağır Kamyon",
    moto: "Motosiklet",
  };
  return labels[vehicleClass];
}

export function getTollTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    gise: "Otoyol Gişe",
    bridge: "Köprü",
    tunnel: "Tünel",
    ferry: "Feribot",
  };
  return labels[type] || type;
}

export function getTollTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    gise: "🛣️",
    bridge: "🌉",
    tunnel: "🚇",
    ferry: "⛴️",
  };
  return icons[type] || "📍";
}

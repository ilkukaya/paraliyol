import type { VehicleClass } from "./engine/types";

const tl0 = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 });
const tl2 = new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** 1234.5 → "1.234,50 TL", 1234 → "1.234 TL" */
export function tl(amount: number): string {
  const whole = Math.abs(amount - Math.round(amount)) < 0.005;
  return `${whole ? tl0.format(Math.round(amount)) : tl2.format(amount)} TL`;
}

export function km(value: number): string {
  return `${tl0.format(Math.round(value))} km`;
}

export function duration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (!h) return `${m} dk`;
  return m ? `${h} sa ${m} dk` : `${h} sa`;
}

export function trDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export const VEHICLE_LABELS: Record<VehicleClass, { short: string; long: string; example: string }> = {
  "1": { short: "Otomobil", long: "1. Sınıf", example: "Otomobil, SUV, panelvan (aks aralığı 3,20 m'den kısa)" },
  "2": { short: "Minibüs", long: "2. Sınıf", example: "Minibüs, kamyonet, hafif ticari (aks aralığı 3,20 m ve üzeri, 2 aks)" },
  "3": { short: "Otobüs / 3 aks", long: "3. Sınıf", example: "3 akslı otobüs, kamyon ve çekiciler" },
  "4": { short: "4-5 aks", long: "4. Sınıf", example: "4 ve 5 akslı kamyon, tır ve çekiciler" },
  "5": { short: "6+ aks", long: "5. Sınıf", example: "6 ve daha fazla akslı ağır vasıtalar" },
  "6": { short: "Motosiklet", long: "6. Sınıf", example: "Tüm motosikletler" },
};

/** Turkish suffix helpers for "X'dan/X'den", "X'a/X'e" style phrases. */
const BACK = /[aıou]/;
const lastVowel = (w: string) => {
  const m = w.toLocaleLowerCase("tr-TR").match(/[aeıioöuü](?=[^aeıioöuü]*$)/);
  return m ? m[0] : "e";
};
const HARD = /[fstkçşhp]$/i;
const baseWord = (name: string) => name.replace(/\s*\(.*\)\s*$/, "").trim();

export function ablative(name: string): string {
  const w = baseWord(name);
  const v = BACK.test(lastVowel(w)) ? "a" : "e";
  const c = HARD.test(w) ? "t" : "d";
  return `${w}'${c}${v}n`;
}

export function dative(name: string): string {
  const w = baseWord(name);
  const v = BACK.test(lastVowel(w)) ? "a" : "e";
  const vowelEnd = /[aeıioöuü]$/i.test(w);
  return `${w}'${vowelEnd ? "y" : ""}${v}`;
}

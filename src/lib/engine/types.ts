import type { LatLng } from "./geo";

/** KGM vehicle classes. Class "6" is motorcycle. */
export const VEHICLE_CLASSES = ["1", "2", "3", "4", "5", "6"] as const;
export type VehicleClass = (typeof VEHICLE_CLASSES)[number];

/** Six prices, index 0 = class 1 ... index 5 = class 6 (motosiklet). */
export type PriceRow = [number, number, number, number, number, number];

export interface TollStation {
  id: string;
  name: string;
  pdfName?: string;
  lat: number;
  lng: number;
  coord?: "high" | "medium" | "low";
}

export interface TollSection {
  id: string;
  name: string;
  stations: string[];
  prices: Record<string, Record<string, number[]>>;
}

export interface HighwayData {
  code: string;
  name: string;
  shortName?: string;
  operator?: string;
  source: string;
  validFrom: string;
  rules?: string[];
  stations: TollStation[];
  roads: [string, string][];
  sections: TollSection[];
  connections?: { station: string; to: string; note?: string }[];
  /** Road edges of this highway that cross a bridge listed in bridges.json. */
  bridgeEdges?: { a: string; b: string; bridge: string; included?: boolean }[];
}

export interface BridgeData {
  id: string;
  name: string;
  type: "bridge" | "tunnel" | "ferry";
  operator?: string;
  source?: string;
  prices: number[];
  bothDirections?: boolean;
  /** Vehicle classes allowed to use the crossing (all when omitted). */
  allowedClasses?: VehicleClass[];
  ends: { lat: number; lng: number; label?: string }[];
  rules?: string[];
  /** Crossings without an official KGM source are shown but flagged. */
  verified?: boolean;
  /** Whether the route engine may use this crossing. */
  routable?: boolean;
  description?: string;
  slug?: string;
}

export interface Location {
  id: string;
  name: string;
  il: string;
  lat: number;
  lng: number;
  popular: boolean;
  type: "il" | "ilce";
}

export type TollKind = "highway" | "bridge" | "tunnel" | "ferry";

export interface TollItem {
  kind: TollKind;
  /** highway code or bridge id */
  ref: string;
  name: string;
  detail?: string;
  entry?: string;
  exit?: string;
  price: number;
  /** map position of the toll point */
  pos?: LatLng;
  /** true when the tariff had no exact entry/exit pair */
  estimated?: boolean;
}

export interface RouteLeg {
  kind: "highway" | "free" | "bridge";
  ref?: string;
  label: string;
  km: number;
}

export interface RouteResult {
  mode: "fastest" | "economic";
  vehicleClass: VehicleClass;
  km: number;
  minutes: number;
  tolls: TollItem[];
  total: number;
  path: LatLng[];
  legs: RouteLeg[];
  /** Highways used, in order (codes). */
  highways: string[];
}

export { type LatLng };

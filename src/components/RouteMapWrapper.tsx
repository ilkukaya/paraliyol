"use client";

import dynamic from "next/dynamic";
import type { TollOnRoute } from "@/types";

const RouteMap = dynamic(() => import("./RouteMap"), { ssr: false });

interface RouteMapWrapperProps {
  waypoints: [number, number][];
  tolls: TollOnRoute[];
}

export default function RouteMapWrapper({ waypoints, tolls }: RouteMapWrapperProps) {
  return <RouteMap waypoints={waypoints} tolls={tolls} />;
}

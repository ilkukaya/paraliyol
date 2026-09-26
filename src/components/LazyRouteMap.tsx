"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { LatLng } from "@/lib/engine/types";
import type { MapMarker } from "./RouteMap";

const RouteMap = dynamic(() => import("./RouteMap"), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse rounded-[var(--radius-card)] bg-[var(--surface-2)] sm:h-[420px]" />,
});

/** Loads Leaflet only when the map scrolls into view. */
export default function LazyRouteMap(props: { path: LatLng[]; markers: MapMarker[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setShow(true), { rootMargin: "200px" });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className="min-h-[300px] sm:min-h-[420px]">
      {show ? <RouteMap {...props} /> : <div className="h-[300px] rounded-[var(--radius-card)] bg-[var(--surface-2)] sm:h-[420px]" />}
    </div>
  );
}

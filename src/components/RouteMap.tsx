"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { LatLng } from "@/lib/engine/types";

export interface MapMarker {
  pos: LatLng;
  label: string;
  kind: "start" | "end" | "toll";
}

export default function RouteMap({ path, markers }: { path: LatLng[]; markers: MapMarker[] }) {
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let map: import("leaflet").Map | null = null;
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !el.current) return;
      map = L.map(el.current, { scrollWheelZoom: false, attributionControl: true, zoomControl: true });
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      const line = L.polyline(path, { color: "#0b6e44", weight: 5, opacity: 0.9 }).addTo(map);
      L.polyline(path, { color: "#f2b705", weight: 1.5, dashArray: "6 8", opacity: 0.9 }).addTo(map);
      for (const m of markers) {
        const style =
          m.kind === "toll"
            ? "background:#fff;color:#0b6e44;border:2px solid #0b6e44;width:22px;height:22px;font-size:11px"
            : `background:${m.kind === "start" ? "#0b6e44" : "#13201a"};color:#fff;border:3px solid #fff;width:30px;height:30px;font-size:13px`;
        const text = m.kind === "start" ? "A" : m.kind === "end" ? "B" : "₺";
        L.marker(m.pos, {
          title: m.label,
          icon: L.divIcon({
            className: "",
            html: `<div style="${style};border-radius:999px;display:grid;place-items:center;font-weight:800;box-shadow:0 2px 6px rgba(0,0,0,.3)">${text}</div>`,
            iconSize: m.kind === "toll" ? [22, 22] : [30, 30],
            iconAnchor: m.kind === "toll" ? [11, 11] : [15, 15],
          }),
        })
          .bindTooltip(m.label)
          .addTo(map);
      }
      map.fitBounds(line.getBounds(), { padding: [28, 28] });
    });
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [path, markers]);

  return <div ref={el} className="h-[300px] w-full overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] sm:h-[420px]" role="img" aria-label="Rota haritası" />;
}

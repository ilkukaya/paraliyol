"use client";

import { useEffect, useRef } from "react";
import type { TollOnRoute } from "@/types";

interface RouteMapProps {
  waypoints: [number, number][];
  tolls: TollOnRoute[];
}

export default function RouteMap({ waypoints, tolls }: RouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    import("leaflet").then((L) => {
      // Fix default icon issue
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (!mapRef.current) return;

      const map = L.map(mapRef.current, {
        scrollWheelZoom: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 18,
      }).addTo(map);

      // Draw route line
      if (waypoints.length > 1) {
        const polyline = L.polyline(waypoints, {
          color: "#16a34a",
          weight: 4,
          opacity: 0.8,
        }).addTo(map);

        // Start marker
        L.marker(waypoints[0], {
          icon: L.divIcon({
            html: '<div style="background:#16a34a;color:white;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:12px;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)">A</div>',
            iconSize: [28, 28],
            iconAnchor: [14, 14],
            className: "",
          }),
        }).addTo(map);

        // End marker
        L.marker(waypoints[waypoints.length - 1], {
          icon: L.divIcon({
            html: '<div style="background:#dc2626;color:white;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:12px;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)">B</div>',
            iconSize: [28, 28],
            iconAnchor: [14, 14],
            className: "",
          }),
        }).addTo(map);

        map.fitBounds(polyline.getBounds(), { padding: [30, 30] });
      }

      // Add toll markers
      const typeEmoji: Record<string, string> = {
        gise: "🛣️",
        bridge: "🌉",
        tunnel: "🚇",
        ferry: "⛴️",
      };

      tolls.forEach((toll) => {
        // Find approximate position from waypoints for toll markers
        const midIndex = Math.floor(waypoints.length / 2);
        const pos = waypoints[midIndex] || waypoints[0];
        if (!pos) return;

        L.marker(pos, {
          icon: L.divIcon({
            html: `<div style="background:white;border-radius:8px;padding:2px 6px;font-size:14px;border:2px solid #16a34a;box-shadow:0 2px 4px rgba(0,0,0,0.2);white-space:nowrap">${typeEmoji[toll.type] || "📍"}</div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
            className: "",
          }),
        })
          .bindPopup(`<b>${toll.name}</b>`)
          .addTo(map);
      });

      mapInstanceRef.current = map;
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [waypoints, tolls]);

  return (
    <>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />
      <div
        ref={mapRef}
        className="w-full h-[300px] md:h-[400px] rounded-xl overflow-hidden border border-gray-200"
      />
    </>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Location, VehicleClass } from "@/types";
import LocationAutocomplete from "./LocationAutocomplete";
import VehicleClassSelector from "./VehicleClassSelector";

interface RouteSearchFormProps {
  locations: Location[];
  initialFrom?: string;
  initialTo?: string;
  initialClass?: VehicleClass;
}

export default function RouteSearchForm({
  locations,
  initialFrom = "",
  initialTo = "",
  initialClass = "1",
}: RouteSearchFormProps) {
  const router = useRouter();
  const [fromId, setFromId] = useState(initialFrom);
  const [toId, setToId] = useState(initialTo);
  const [vehicleClass, setVehicleClass] = useState<VehicleClass>(initialClass);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromId || !toId) return;
    if (fromId === toId) return;
    router.push(`/sonuc?from=${fromId}&to=${toId}&class=${vehicleClass}`);
  };

  const handleSwap = () => {
    setFromId(toId);
    setToId(fromId);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
        <div className="space-y-3">
          <LocationAutocomplete
            locations={locations}
            value={fromId}
            onChange={setFromId}
            placeholder="Nereden? (ör: İstanbul)"
            label="Nereden"
          />

          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleSwap}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              title="Yönleri değiştir"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                />
              </svg>
            </button>
          </div>

          <LocationAutocomplete
            locations={locations}
            value={toId}
            onChange={setToId}
            placeholder="Nereye? (ör: Ankara)"
            label="Nereye"
          />
        </div>

        <VehicleClassSelector value={vehicleClass} onChange={setVehicleClass} />

        <button
          type="submit"
          disabled={!fromId || !toId || fromId === toId}
          className="w-full py-3 px-6 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors text-lg"
        >
          Hesapla
        </button>
      </div>
    </form>
  );
}

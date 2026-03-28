"use client";

import type { VehicleClass } from "@/types";
import { getVehicleClassShortLabel } from "@/lib/format";

interface VehicleClassSelectorProps {
  value: VehicleClass;
  onChange: (value: VehicleClass) => void;
}

const VEHICLE_CLASSES: VehicleClass[] = ["1", "2", "3", "4", "5", "moto"];

export default function VehicleClassSelector({
  value,
  onChange,
}: VehicleClassSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Araç Sınıfı
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as VehicleClass)}
        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white text-base"
      >
        {VEHICLE_CLASSES.map((vc) => (
          <option key={vc} value={vc}>
            {getVehicleClassShortLabel(vc)}
          </option>
        ))}
      </select>
    </div>
  );
}

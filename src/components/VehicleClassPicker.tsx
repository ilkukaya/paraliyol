"use client";

import { VEHICLE_CLASSES, type VehicleClass } from "@/lib/engine/types";
import { VEHICLE_LABELS } from "@/lib/format";
import VehicleIcon from "./VehicleIcon";

export default function VehicleClassPicker({
  value,
  onChange,
  compact = false,
}: {
  value: VehicleClass;
  onChange: (vc: VehicleClass) => void;
  compact?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label="Araç sınıfı" className={`grid gap-2 ${compact ? "grid-cols-6" : "grid-cols-3 sm:grid-cols-6"}`}>
      {VEHICLE_CLASSES.map((vc) => {
        const on = vc === value;
        return (
          <button
            key={vc}
            type="button"
            role="radio"
            aria-checked={on}
            title={`${VEHICLE_LABELS[vc].long}: ${VEHICLE_LABELS[vc].example}`}
            onClick={() => onChange(vc)}
            className={`flex flex-col items-center justify-center gap-1 rounded-2xl border px-1 transition ${compact ? "h-14" : "h-[4.5rem]"} ${
              on
                ? "border-sign-600 bg-sign-600 text-white shadow-md"
                : "border-[var(--border)] bg-[var(--surface)] text-[var(--fg)] hover:border-sign-400"
            }`}
          >
            <VehicleIcon vc={vc} className={compact ? "h-5 w-7" : "h-6 w-8"} />
            <span className={`text-center font-semibold leading-tight ${compact ? "text-[10px]" : "text-[11px] sm:text-xs"}`}>
              {VEHICLE_LABELS[vc].short}
            </span>
          </button>
        );
      })}
    </div>
  );
}

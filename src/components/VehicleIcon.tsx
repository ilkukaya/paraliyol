import type { VehicleClass } from "@/lib/engine/types";

const paths: Record<VehicleClass, React.ReactNode> = {
  "1": (
    <>
      <path d="M5 16h22M7 16l2.4-5.2A2 2 0 0 1 11.2 9.6h8.6a2 2 0 0 1 1.6.8L25 16" />
      <path d="M4 16h24v4H4z" />
      <circle cx="9.5" cy="21" r="2" />
      <circle cx="22.5" cy="21" r="2" />
    </>
  ),
  "2": (
    <>
      <path d="M4 20V10a2 2 0 0 1 2-2h14l6 6v6z" />
      <path d="M20 8v6h6M9 12h7" />
      <circle cx="9" cy="21" r="2" />
      <circle cx="21.5" cy="21" r="2" />
    </>
  ),
  "3": (
    <>
      <rect x="3" y="7" width="26" height="13" rx="2" />
      <path d="M3 12h26M8 7v5M14 7v5M20 7v5" />
      <circle cx="8" cy="21" r="2" />
      <circle cx="21" cy="21" r="2" />
      <circle cx="25.5" cy="21" r="2" />
    </>
  ),
  "4": (
    <>
      <path d="M2 18V8h16v10M18 11h5l4 4v3H2" />
      <circle cx="6" cy="21" r="2" />
      <circle cx="11" cy="21" r="2" />
      <circle cx="21" cy="21" r="2" />
      <circle cx="26" cy="21" r="2" />
    </>
  ),
  "5": (
    <>
      <path d="M1 18V7h19v11M20 10h5l5 5v3H1" />
      <circle cx="4" cy="21" r="1.8" />
      <circle cx="8.5" cy="21" r="1.8" />
      <circle cx="13" cy="21" r="1.8" />
      <circle cx="21" cy="21" r="1.8" />
      <circle cx="25.5" cy="21" r="1.8" />
      <circle cx="29" cy="21" r="1.4" />
    </>
  ),
  "6": (
    <>
      <circle cx="7" cy="19" r="3.5" />
      <circle cx="25" cy="19" r="3.5" />
      <path d="M7 19l5-7h6l3 7M18 12l2-4h3M12 12h-2" />
    </>
  ),
};

export default function VehicleIcon({ vc, className = "h-6 w-8" }: { vc: VehicleClass; className?: string }) {
  return (
    <svg viewBox="0 0 32 26" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[vc]}
    </svg>
  );
}

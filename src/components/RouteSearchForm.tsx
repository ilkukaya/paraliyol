"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Location, VehicleClass } from "@/lib/engine/types";
import { routeSlug } from "@/lib/engine/slugs";
import LocationCombobox from "./LocationCombobox";
import VehicleClassPicker from "./VehicleClassPicker";

const Pin = ({ filled }: { filled?: boolean }) => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
    {filled ? <path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Zm0-9a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z" /> : <circle cx="12" cy="12" r="6" />}
  </svg>
);

export default function RouteSearchForm({
  locations,
  initialFrom = "",
  initialTo = "",
  initialClass = "1",
}: {
  locations: Location[];
  initialFrom?: string;
  initialTo?: string;
  initialClass?: VehicleClass;
}) {
  const router = useRouter();
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [vc, setVc] = useState<VehicleClass>(initialClass);
  const [pending, start] = useTransition();
  const ready = from && to && from !== to;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready) return;
    const q = vc === "1" ? "" : `?arac=${vc}`;
    start(() => router.push(`/${routeSlug(from, to)}${q}`));
  };

  return (
    <form onSubmit={submit} className="card p-4 text-[var(--fg)] sm:p-6" aria-label="Geçiş ücreti hesapla">
      <div className="relative grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-end">
        <LocationCombobox label="Nereden" placeholder="Şehir veya ilçe" locations={locations} value={from} onChange={setFrom} exclude={to} icon={<Pin />} />
        <button
          type="button"
          onClick={() => {
            setFrom(to);
            setTo(from);
          }}
          aria-label="Yönü değiştir"
          className="absolute right-3 top-[3.9rem] z-10 grid h-10 w-10 place-items-center rounded-full border border-[var(--border)] bg-[var(--surface)] shadow-sm hover:border-sign-400 md:static md:mb-2 md:rotate-90"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M7 4v16M7 20l-3-3M7 20l3-3M17 20V4M17 4l-3 3M17 4l3 3" />
          </svg>
        </button>
        <LocationCombobox label="Nereye" placeholder="Şehir veya ilçe" locations={locations} value={to} onChange={setTo} exclude={from} icon={<Pin filled />} />
      </div>
      <div className="mt-5">
        <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-[var(--fg-muted)]">Araç sınıfı</p>
        <VehicleClassPicker value={vc} onChange={setVc} />
      </div>
      <button
        type="submit"
        disabled={!ready || pending}
        className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-lane-500 text-lg font-bold text-sign-950 shadow-sm transition hover:bg-lane-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Hesaplanıyor…" : "Ücreti hesapla"}
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </button>
    </form>
  );
}

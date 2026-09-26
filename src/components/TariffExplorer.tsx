"use client";

import { useMemo, useState } from "react";
import { VEHICLE_CLASSES, type VehicleClass } from "@/lib/engine/types";
import { tl, VEHICLE_LABELS } from "@/lib/format";

interface Props {
  sections: { id: string; name: string; stations: { id: string; name: string }[]; prices: Record<string, Record<string, number[]>> }[];
}

export default function TariffExplorer({ sections }: Props) {
  const [sid, setSid] = useState(sections[0].id);
  const section = sections.find((s) => s.id === sid)!;
  const [entry, setEntry] = useState(section.stations[0].id);
  const exits = useMemo(() => section.stations.filter((s) => section.prices[entry]?.[s.id]), [section, entry]);
  const [exit, setExit] = useState(exits.at(-1)?.id ?? "");
  const row = section.prices[entry]?.[exit];
  const [vc, setVc] = useState<VehicleClass>("1");

  const selectCls =
    "mt-1 h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-base font-semibold outline-none focus:border-sign-500";

  return (
    <div className="card p-5">
      <h2 className="text-xl font-bold">Gişeden gişeye ücret hesapla</h2>
      {sections.length > 1 && (
        <label className="mt-4 block text-xs font-bold uppercase tracking-wider text-[var(--fg-muted)]">
          Kesim
          <select
            className={selectCls}
            value={sid}
            onChange={(e) => {
              const s = sections.find((x) => x.id === e.target.value)!;
              setSid(s.id);
              setEntry(s.stations[0].id);
              setExit(s.stations.at(-1)!.id);
            }}
          >
            {sections.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </label>
      )}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="text-xs font-bold uppercase tracking-wider text-[var(--fg-muted)]">
          Giriş gişesi
          <select
            className={selectCls}
            value={entry}
            onChange={(e) => {
              setEntry(e.target.value);
              const first = section.stations.find((s) => section.prices[e.target.value]?.[s.id]);
              if (!section.prices[e.target.value]?.[exit]) setExit(first?.id ?? "");
            }}
          >
            {section.stations.filter((s) => section.prices[s.id]).map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </label>
        <label className="text-xs font-bold uppercase tracking-wider text-[var(--fg-muted)]">
          Çıkış gişesi
          <select className={selectCls} value={exit} onChange={(e) => setExit(e.target.value)}>
            {exits.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </label>
        <label className="text-xs font-bold uppercase tracking-wider text-[var(--fg-muted)]">
          Araç sınıfı
          <select className={selectCls} value={vc} onChange={(e) => setVc(e.target.value as VehicleClass)}>
            {VEHICLE_CLASSES.map((c) => (
              <option key={c} value={c}>{VEHICLE_LABELS[c].long} · {VEHICLE_LABELS[c].short}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-5 flex items-end justify-between rounded-2xl bg-sign-50 p-4 dark:bg-sign-900">
        <span className="text-sm font-semibold text-sign-800 dark:text-sign-100">Geçiş ücreti</span>
        <span className="num font-display text-4xl font-extrabold text-sign-800 dark:text-white" aria-live="polite">
          {row ? tl(row[Number(vc) - 1]) : "—"}
        </span>
      </div>
    </div>
  );
}

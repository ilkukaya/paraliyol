"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { VEHICLE_CLASSES, type RouteResult, type VehicleClass } from "@/lib/engine/types";
import { duration, km, tl, VEHICLE_LABELS } from "@/lib/format";
import VehicleClassPicker from "./VehicleClassPicker";
import LazyRouteMap from "./LazyRouteMap";
import type { MapMarker } from "./RouteMap";

export interface TripViewData {
  fromName: string;
  toName: string;
  byClass: Record<VehicleClass, { fastest: RouteResult; economic: RouteResult | null }>;
  /** fastest total of the reverse direction, per class (for round trips) */
  returnTotal: Record<VehicleClass, number>;
  reverseHref: string;
}

const DEFAULT_CONSUMPTION: Record<VehicleClass, number> = { "1": 7, "2": 10, "3": 28, "4": 33, "5": 36, "6": 4.5 };

const kindLabel = { highway: "Otoyol", bridge: "Köprü", tunnel: "Tünel", ferry: "Feribot" } as const;

function readStored(key: string) {
  try {
    return localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

export default function TripView({ data }: { data: TripViewData }) {
  const [vc, setVc] = useState<VehicleClass>("1");
  const [mode, setMode] = useState<"fastest" | "economic">("fastest");
  const [roundTrip, setRoundTrip] = useState(false);
  const [fuelPrice, setFuelPrice] = useState("");
  const [consumption, setConsumption] = useState("");
  const [people, setPeople] = useState(1);
  const [copied, setCopied] = useState(false);

  // Restore ?arac= and the saved fuel price after hydration (the page itself is static).
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const q = new URLSearchParams(window.location.search).get("arac");
      if (q && (VEHICLE_CLASSES as readonly string[]).includes(q)) setVc(q as VehicleClass);
      setFuelPrice(readStored("paraliyol-fuel-price"));
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const option = data.byClass[vc];
  const route = mode === "economic" && option.economic ? option.economic : option.fastest;
  const tollTotal = route.total + (roundTrip ? (mode === "fastest" ? data.returnTotal[vc] : route.total) : 0);
  const distance = route.km * (roundTrip ? 2 : 1);
  const cons = Number(consumption.replace(",", ".")) || DEFAULT_CONSUMPTION[vc];
  const price = Number(fuelPrice.replace(",", "."));
  const fuelCost = price > 0 ? (distance * cons * price) / 100 : 0;
  const grand = tollTotal + fuelCost;

  const markers = useMemo<MapMarker[]>(() => {
    const m: MapMarker[] = [
      { pos: route.path[0], label: data.fromName, kind: "start" },
      { pos: route.path[route.path.length - 1], label: data.toName, kind: "end" },
    ];
    for (const t of route.tolls) if (t.pos) m.push({ pos: t.pos, label: `${t.name}: ${tl(t.price)}`, kind: "toll" });
    return m;
  }, [route, data.fromName, data.toName]);

  const share = async () => {
    const url = window.location.href.split("?")[0] + (vc === "1" ? "" : `?arac=${vc}`);
    const text = `${data.fromName} → ${data.toName} geçiş ücreti (${VEHICLE_LABELS[vc].short}): ${tl(route.total)}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: text, text, url });
        return;
      } catch {
        /* dismissed */
      }
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const whatsapp = `https://wa.me/?text=${encodeURIComponent(
    `${data.fromName} → ${data.toName} geçiş ücreti (${VEHICLE_LABELS[vc].short}): ${tl(route.total)} — `,
  )}`;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0 space-y-6">
        {/* Summary */}
        <section className="card overflow-hidden" aria-label="Özet">
          <div className="border-b border-[var(--border)] p-4 sm:p-5">
            <VehicleClassPicker value={vc} onChange={setVc} compact />
          </div>
          {option.economic && (
            <div className="flex gap-2 border-b border-[var(--border)] p-3 sm:px-5" role="tablist" aria-label="Rota tercihi">
              {(["fastest", "economic"] as const).map((m) => (
                <button
                  key={m}
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => setMode(m)}
                  className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                    mode === m ? "bg-sign-50 text-sign-800 ring-1 ring-sign-300 dark:bg-sign-900 dark:text-sign-100" : "text-[var(--fg-muted)] hover:bg-[var(--surface-2)]"
                  }`}
                >
                  {m === "fastest" ? "En hızlı rota" : "Otoyolsuz rota"}
                  <span className="num block text-xs font-medium opacity-80">
                    {tl((m === "fastest" ? option.fastest : option.economic!).total)} ·{" "}
                    {duration((m === "fastest" ? option.fastest : option.economic!).minutes)}
                  </span>
                </button>
              ))}
            </div>
          )}
          <div className="grid gap-5 p-5 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <p className="text-sm font-semibold text-[var(--fg-muted)]">
                {roundTrip ? "Gidiş-dönüş toplam geçiş ücreti" : "Toplam geçiş ücreti"} · {VEHICLE_LABELS[vc].short}
              </p>
              <p className="num font-display mt-1 text-5xl font-extrabold tracking-tight sm:text-6xl" aria-live="polite">
                {tl(tollTotal)}
              </p>
              <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
                <div className="flex gap-1.5">
                  <dt className="muted">Mesafe</dt>
                  <dd className="num font-semibold">≈ {km(distance)}</dd>
                </div>
                <div className="flex gap-1.5">
                  <dt className="muted">Süre</dt>
                  <dd className="num font-semibold">≈ {duration(route.minutes * (roundTrip ? 2 : 1))}</dd>
                </div>
                <div className="flex gap-1.5">
                  <dt className="muted">Ücretli geçiş</dt>
                  <dd className="num font-semibold">{route.tolls.length}</dd>
                </div>
              </dl>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-col sm:items-stretch">
              <label className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[var(--border)] px-2 text-sm font-semibold">
                <input type="checkbox" checked={roundTrip} onChange={(e) => setRoundTrip(e.target.checked)} className="h-4 w-4 accent-sign-600" />
                Gidiş-dönüş
              </label>
              <button onClick={share} className="h-11 rounded-xl border border-[var(--border)] px-3 text-sm font-semibold hover:bg-[var(--surface-2)]">
                {copied ? "Bağlantı kopyalandı" : "Paylaş"}
              </button>
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="grid h-11 place-items-center rounded-xl bg-[#1f9d55] px-3 text-sm font-semibold text-white hover:bg-[#188a49]"
              >
                WhatsApp
              </a>
            </div>
          </div>
        </section>

        {/* Breakdown */}
        <section className="card p-5" aria-labelledby="dokum">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="dokum" className="text-xl font-bold">Ücret dökümü</h2>
            <Link href={data.reverseHref} className="text-sm font-semibold text-sign-600 hover:underline dark:text-sign-300">
              Ters yön →
            </Link>
          </div>
          {route.tolls.length === 0 ? (
            <p className="mt-4 rounded-xl bg-sign-50 p-4 font-semibold text-sign-800 dark:bg-sign-900 dark:text-sign-100">
              Bu rotada ücretli otoyol, köprü veya tünel geçişi bulunmuyor.
            </p>
          ) : (
            <ol className="mt-5 space-y-0">
              <li className="relative flex gap-4 pb-5">
                <span className="z-10 mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-sign-600 text-xs font-extrabold text-white">A</span>
                <span className="font-semibold">{data.fromName}</span>
                <span aria-hidden className="absolute left-[13px] top-7 h-full w-0.5 bg-[var(--border)]" />
              </li>
              {route.tolls.map((t, i) => (
                <li key={`${t.ref}-${i}`} className="relative flex gap-4 pb-5">
                  <span className="z-10 mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 border-sign-600 bg-[var(--surface)] text-[11px] font-extrabold text-sign-700 dark:text-sign-200">
                    ₺
                  </span>
                  <span aria-hidden className="absolute left-[13px] top-7 h-full w-0.5 bg-[var(--border)]" />
                  <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold">{t.name}</p>
                      <p className="muted text-sm">
                        {kindLabel[t.kind]}
                        {t.entry && t.exit ? ` · ${t.entry} → ${t.exit}` : ""}
                      </p>
                      {t.estimated && (
                        <p className="mt-1 text-xs font-semibold text-lane-600">Bu giriş-çıkış çifti tarifede yok; en yakın tarife değeri gösteriliyor.</p>
                      )}
                    </div>
                    <p className="num shrink-0 text-lg font-bold">{tl(t.price)}</p>
                  </div>
                </li>
              ))}
              <li className="flex gap-4">
                <span className="z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink text-xs font-extrabold text-white dark:bg-white dark:text-ink">B</span>
                <span className="font-semibold">{data.toName}</span>
              </li>
            </ol>
          )}
          {route.tolls.length > 0 && (
            <div className="mt-5 flex items-center justify-between rounded-xl bg-[var(--surface-2)] px-4 py-3">
              <span className="font-semibold">Tek yön toplam</span>
              <span className="num text-xl font-extrabold">{tl(route.total)}</span>
            </div>
          )}
        </section>

        <LazyRouteMap path={route.path} markers={markers} />
      </div>

      {/* Side column */}
      <aside className="space-y-6">
        <section className="card p-5" aria-labelledby="masraf">
          <h2 id="masraf" className="text-lg font-bold">Toplam yol masrafı</h2>
          <p className="muted mt-1 text-sm">Yakıt fiyatınızı girin, geçiş ücretiyle birlikte hesaplayalım.</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--fg-muted)]">
              Yakıt (TL/L)
              <input
                inputMode="decimal"
                value={fuelPrice}
                placeholder="ör. 48,50"
                onChange={(e) => {
                  setFuelPrice(e.target.value);
                  try {
                    localStorage.setItem("paraliyol-fuel-price", e.target.value);
                  } catch {}
                }}
                className="num mt-1 h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-base font-semibold normal-case tracking-normal text-[var(--fg)] outline-none focus:border-sign-500"
              />
            </label>
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--fg-muted)]">
              Tüketim (L/100 km)
              <input
                inputMode="decimal"
                value={consumption}
                placeholder={String(DEFAULT_CONSUMPTION[vc]).replace(".", ",")}
                onChange={(e) => setConsumption(e.target.value)}
                className="num mt-1 h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-base font-semibold normal-case tracking-normal text-[var(--fg)] outline-none focus:border-sign-500"
              />
            </label>
          </div>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="muted">Geçiş ücretleri</dt>
              <dd className="num font-semibold">{tl(tollTotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="muted">Yakıt ({km(distance)})</dt>
              <dd className="num font-semibold">{fuelCost ? tl(fuelCost) : "—"}</dd>
            </div>
            <div className="flex justify-between border-t border-[var(--border)] pt-2 text-base">
              <dt className="font-bold">Toplam</dt>
              <dd className="num font-extrabold">{tl(grand)}</dd>
            </div>
          </dl>
          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-[var(--surface-2)] p-3">
            <span className="text-sm font-semibold">Kişi başı</span>
            <div className="flex items-center gap-2">
              <button aria-label="Kişi azalt" onClick={() => setPeople((p) => Math.max(1, p - 1))} className="grid h-9 w-9 place-items-center rounded-lg border border-[var(--border)] text-lg font-bold">
                −
              </button>
              <span className="num w-6 text-center font-bold">{people}</span>
              <button aria-label="Kişi artır" onClick={() => setPeople((p) => Math.min(9, p + 1))} className="grid h-9 w-9 place-items-center rounded-lg border border-[var(--border)] text-lg font-bold">
                +
              </button>
              <span className="num ml-1 min-w-20 text-right font-extrabold">{tl(grand / people)}</span>
            </div>
          </div>
          <p className="muted mt-3 text-xs leading-5">Mesafe ve süre yaklaşık değerlerdir; trafik ve güzergâh tercihine göre değişir.</p>
        </section>

        <section className="card p-5" aria-labelledby="siniflar">
          <h2 id="siniflar" className="text-lg font-bold">Tüm araç sınıfları</h2>
          <table className="mt-3 w-full text-sm">
            <tbody>
              {VEHICLE_CLASSES.map((c) => (
                <tr key={c} className={`border-b border-[var(--border)] last:border-0 ${c === vc ? "font-bold" : ""}`}>
                  <td className="py-2">
                    <button onClick={() => setVc(c)} className="text-left hover:underline">
                      {VEHICLE_LABELS[c].long} <span className="muted font-normal">· {VEHICLE_LABELS[c].short}</span>
                    </button>
                  </td>
                  <td className="num py-2 text-right">{tl(data.byClass[c].fastest.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </aside>
    </div>
  );
}

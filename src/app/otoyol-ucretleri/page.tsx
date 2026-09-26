import type { Metadata } from "next";
import Link from "next/link";
import { getHighways } from "@/lib/engine";
import { tl, trDate } from "@/lib/format";
import Breadcrumbs from "@/components/Breadcrumbs";

export const metadata: Metadata = {
  title: "Otoyol Ücretleri 2026 – Tüm Otoyollar Gişe Tarifeleri",
  description:
    "Türkiye'deki tüm ücretli otoyolların 2026 geçiş ücretleri: Anadolu, Avrupa, İstanbul-İzmir, Kuzey Marmara, Ankara-Niğde, Çukurova ve İzmir otoyolları için gişe gişe resmi tarifeler.",
  alternates: { canonical: "/otoyol-ucretleri" },
};

export default function HighwaysPage() {
  const highways = getHighways();
  return (
    <div className="mx-auto max-w-6xl px-4 pb-10 pt-6">
      <Breadcrumbs items={[{ name: "Otoyol ücretleri", href: "/otoyol-ucretleri" }]} />
      <h1 className="font-display text-3xl font-extrabold sm:text-5xl">Otoyol ücretleri 2026</h1>
      <p className="muted mt-3 max-w-3xl text-lg leading-8">
        Türkiye&apos;deki {highways.length} ücretli otoyolun resmi geçiş tarifeleri. Bir otoyol seçerek tüm giriş-çıkış gişeleri
        arasındaki ücretleri görebilir, rotanızın toplam maliyetini ana sayfadaki hesaplayıcıyla bulabilirsiniz.
      </p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {highways.map((h) => {
          let max = 0;
          for (const s of h.sections) for (const row of Object.values(s.prices)) for (const p of Object.values(row)) max = Math.max(max, p[0]);
          return (
            <li key={h.code}>
              <Link href={`/otoyol-ucretleri/${h.code.toLowerCase()}`} className="card flex h-full flex-col p-5 transition hover:-translate-y-0.5 hover:border-sign-300">
                <span className="w-fit rounded-md bg-sign-600 px-2 py-0.5 text-xs font-extrabold text-white">{h.code}</span>
                <span className="mt-3 text-lg font-bold leading-snug">{h.name}</span>
                <span className="muted mt-1 text-sm">{h.stations.length} gişe · {trDate(h.validFrom)} tarifesi</span>
                <span className="mt-4 text-sm">
                  En uzun geçiş (otomobil): <strong className="num">{tl(max)}</strong>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="muted mt-8 text-sm">
        İpucu: Birden fazla otoyol ve köprü kullanan yolculuklar için <Link href="/" className="font-semibold underline">rota hesaplayıcıyı</Link> kullanın.
      </p>
    </div>
  );
}

import type { Metadata } from "next";
import { getCrossings } from "@/lib/engine";
import { tl } from "@/lib/format";
import Breadcrumbs from "@/components/Breadcrumbs";
import CrossingCard from "@/components/CrossingCard";
import Faq from "@/components/Faq";
import AdSlot from "@/components/AdSlot";

export const metadata: Metadata = {
  title: "Köprü Geçiş Ücretleri 2026 – Osmangazi, 1915, YSS, FSM",
  description:
    "2026 köprü geçiş ücretleri: Osmangazi Köprüsü, 1915 Çanakkale Köprüsü, Yavuz Sultan Selim, Fatih Sultan Mehmet ve 15 Temmuz Şehitler köprüleri için tüm araç sınıflarının güncel ücretleri.",
  alternates: { canonical: "/kopru-ucretleri" },
};

export default function BridgesPage() {
  const bridges = getCrossings().filter((c) => c.type === "bridge");
  const byName = (s: string) => bridges.find((b) => b.name.includes(s));
  const osm = byName("Osmangazi");
  const c1915 = byName("1915");
  const yss = byName("Yavuz");
  return (
    <div className="mx-auto max-w-4xl px-4 pb-10 pt-6">
      <Breadcrumbs items={[{ name: "Köprü ücretleri", href: "/kopru-ucretleri" }]} />
      <h1 className="font-display text-3xl font-extrabold sm:text-5xl">Köprü geçiş ücretleri 2026</h1>
      <p className="muted mt-3 text-lg leading-8">
        Türkiye&apos;deki ücretli köprülerin araç sınıflarına göre güncel geçiş ücretleri. Ücretler HGS ile tahsil edilir ve KDV dahildir.
      </p>
      <div className="mt-8 space-y-6">
        {bridges.map((b, i) => (
          <div key={b.id}>
            <CrossingCard c={b} />
            {i === 1 && <AdSlot position="inline" />}
          </div>
        ))}
      </div>
      <Faq
        items={[
          ...(osm ? [{ q: "Osmangazi Köprüsü geçiş ücreti ne kadar?", a: `Osmangazi Köprüsü'nden otomobiller için tek geçiş ücreti ${tl(osm.prices[0])}, motosikletler için ${tl(osm.prices[5])}'dir.` }] : []),
          ...(c1915 ? [{ q: "1915 Çanakkale Köprüsü geçiş ücreti ne kadar?", a: `1915 Çanakkale Köprüsü'nden otomobiller için geçiş ücreti ${tl(c1915.prices[0])}'dir.` }] : []),
          ...(yss ? [{ q: "Yavuz Sultan Selim Köprüsü ücreti ne kadar?", a: `Yavuz Sultan Selim Köprüsü'nde otomobil geçiş ücreti ${tl(yss.prices[0])}'dir. Kuzey Marmara Otoyolu üzerinden geçişlerde köprü ücreti otoyol tarifesine dahildir.` }] : []),
          { q: "İstanbul'daki köprüler iki yönlü mü ücretli?", a: "Evet. 1 Ocak 2022'den bu yana 15 Temmuz Şehitler, Fatih Sultan Mehmet ve Yavuz Sultan Selim köprülerinden her iki yönde de geçiş ücreti alınmaktadır." },
        ]}
      />
    </div>
  );
}

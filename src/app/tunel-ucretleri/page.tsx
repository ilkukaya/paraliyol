import type { Metadata } from "next";
import { getCrossings } from "@/lib/engine";
import { tl } from "@/lib/format";
import Breadcrumbs from "@/components/Breadcrumbs";
import CrossingCard from "@/components/CrossingCard";
import Faq from "@/components/Faq";

export const metadata: Metadata = {
  title: "Avrasya Tüneli Geçiş Ücreti 2026 (Gündüz ve Gece)",
  description: "Avrasya Tüneli 2026 geçiş ücretleri: otomobil, minibüs ve motosiklet için gündüz ve %50 indirimli gece tarifesi, geçiş kuralları.",
  alternates: { canonical: "/tunel-ucretleri" },
};

export default function TunnelPage() {
  const tunnels = getCrossings().filter((c) => c.type === "tunnel");
  const a = tunnels[0];
  return (
    <div className="mx-auto max-w-4xl px-4 pb-10 pt-6">
      <Breadcrumbs items={[{ name: "Tünel ücretleri", href: "/tunel-ucretleri" }]} />
      <h1 className="font-display text-3xl font-extrabold sm:text-5xl">Tünel geçiş ücretleri 2026</h1>
      <p className="muted mt-3 text-lg leading-8">
        Türkiye&apos;de ücretli karayolu tüneli olarak İstanbul Boğazı&apos;nın altından geçen Avrasya Tüneli bulunur. Bolu Dağı Tüneli gibi
        diğer tüneller otoyol tarifesine dahildir ya da ücretsizdir.
      </p>
      <div className="mt-8 space-y-6">
        {tunnels.map((t) => (
          <CrossingCard key={t.id} c={t} />
        ))}
      </div>
      {a && (
        <Faq
          items={[
            { q: "Avrasya Tüneli geçiş ücreti ne kadar?", a: `Gündüz tarifesinde otomobiller ${tl(a.prices[0])}, minibüsler ${tl(a.prices[1])}, motosikletler ${tl(a.prices[5])} öder. 00:00–04:59 arasında %50 indirimli gece tarifesi uygulanır.` },
            { q: "Avrasya Tüneli'nden kamyon geçebilir mi?", a: "Hayır. Tünelden yalnızca otomobiller, minibüsler ve motosikletler geçebilir; kamyon, otobüs ve ağır vasıtalar tünele giremez." },
          ]}
        />
      )}
    </div>
  );
}

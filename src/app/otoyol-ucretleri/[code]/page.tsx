import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getHighways } from "@/lib/engine";
import { VEHICLE_CLASSES } from "@/lib/engine/types";
import { tl, trDate, VEHICLE_LABELS } from "@/lib/format";
import Breadcrumbs from "@/components/Breadcrumbs";
import TariffExplorer from "@/components/TariffExplorer";
import AdSlot from "@/components/AdSlot";
import JsonLd from "@/components/JsonLd";
import { absoluteUrl } from "@/lib/site";

type Props = { params: Promise<{ code: string }> };

export const dynamicParams = false;
export function generateStaticParams() {
  return getHighways().map((h) => ({ code: h.code.toLowerCase() }));
}

const find = (code: string) => getHighways().find((h) => h.code.toLowerCase() === code);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const hw = find((await params).code);
  if (!hw) return {};
  const title = `${hw.shortName ?? hw.name} Ücretleri 2026 – Gişe Gişe Tarife`;
  return {
    title,
    description: `${hw.name} (${hw.code}) ${trDate(hw.validFrom)} tarifesi: tüm giriş-çıkış gişeleri arası geçiş ücretleri, 6 araç sınıfı için güncel fiyat tablosu ve hesaplayıcı.`,
    alternates: { canonical: `/otoyol-ucretleri/${hw.code.toLowerCase()}` },
  };
}

export default async function HighwayPage({ params }: Props) {
  const { code } = await params;
  const hw = find(code);
  if (!hw) notFound();
  const names = new Map(hw.stations.map((s) => [s.id, s.name]));
  const sections = hw.sections.map((s) => ({
    id: s.id,
    name: s.name,
    stations: s.stations.map((id) => ({ id, name: names.get(id) ?? id })),
    prices: s.prices,
  }));
  // SEO table: every exit from the first station of each section
  const tables = sections.map((s) => {
    const origin = s.stations.find((st) => Object.keys(s.prices[st.id] ?? {}).length) ?? s.stations[0];
    const rows = s.stations.filter((st) => s.prices[origin.id]?.[st.id]).map((st) => ({ name: st.name, p: s.prices[origin.id][st.id] }));
    return { section: s, origin, rows };
  });
  const others = getHighways().filter((h) => h.code !== hw.code);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-10 pt-6">
      <Breadcrumbs items={[{ name: "Otoyol ücretleri", href: "/otoyol-ucretleri" }, { name: hw.shortName ?? hw.name, href: `/otoyol-ucretleri/${code}` }]} />
      <header className="road-sign mb-6 px-6 py-7 sm:px-9">
        <p className="inline-flex rounded-md bg-white px-2 py-0.5 text-sm font-extrabold text-sign-700">{hw.code}</p>
        <h1 className="font-display mt-3 text-3xl font-extrabold sm:text-4xl">{hw.name} ücretleri 2026</h1>
        <p className="mt-2 text-sign-50">
          {hw.stations.length} gişe · {trDate(hw.validFrom)} tarihinden itibaren geçerli tarife{hw.operator ? ` · İşletmeci: ${hw.operator}` : ""}
        </p>
      </header>

      <TariffExplorer sections={sections} />

      <AdSlot position="inline" />

      {tables.map(({ section, origin, rows }) => (
        <section key={section.id} className="mt-10">
          <h2 className="text-2xl font-bold">{origin.name} çıkışlı ücretler{sections.length > 1 ? ` (${section.name})` : ""}</h2>
          <div className="card mt-4 overflow-x-auto">
            <table className="num w-full min-w-[640px] text-sm">
              <thead className="bg-[var(--surface-2)] text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold">{origin.name} →</th>
                  {VEHICLE_CLASSES.map((c) => (
                    <th key={c} className="px-3 py-3 text-right font-semibold">{VEHICLE_LABELS[c].short}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.name} className="border-t border-[var(--border)]">
                    <td className="px-4 py-2.5 font-medium">{r.name}</td>
                    {r.p.map((v, i) => (
                      <td key={i} className="px-3 py-2.5 text-right">{tl(v)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      {hw.rules && hw.rules.length > 0 && (
        <section className="prose-tr mt-10">
          <h2>Tarife notları</h2>
          <ul>
            {hw.rules.filter((r) => !r.startsWith("Tablo yorumu")).map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <p className="text-sm">
            Kaynak: Karayolları Genel Müdürlüğü resmi tarife dosyası ({hw.source}). Ücretlere KDV dahildir.
          </p>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-xl font-bold">Diğer otoyollar</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {others.map((h) => (
            <li key={h.code}>
              <Link href={`/otoyol-ucretleri/${h.code.toLowerCase()}`} className="inline-flex rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-sm font-semibold hover:border-sign-400">
                {h.shortName ?? h.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Dataset",
          name: `${hw.name} geçiş ücretleri tarifesi`,
          description: `${hw.name} üzerindeki tüm gişeler arası, 6 araç sınıfı için geçiş ücretleri (TL, KDV dahil).`,
          url: absoluteUrl(`/otoyol-ucretleri/${code}`),
          inLanguage: "tr-TR",
          temporalCoverage: `${hw.validFrom}/..`,
          isBasedOn: "https://www.kgm.gov.tr/Sayfalar/KGM/SiteTr/Otoyollar/UcretlerYeni.aspx",
          creator: { "@type": "GovernmentOrganization", name: "Karayolları Genel Müdürlüğü" },
        }}
      />
    </div>
  );
}

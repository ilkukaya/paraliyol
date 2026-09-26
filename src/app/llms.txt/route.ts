import { getCrossings, getHighways } from "@/lib/engine";
import { featuredRoutes } from "@/lib/featured";
import { GUIDES } from "@/content/guides";
import { tl } from "@/lib/format";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

// https://llmstxt.org — a concise, citable summary for AI answer engines.
export function GET() {
  const lines = [
    "# Paralıyol",
    "",
    "> Türkiye'deki otoyol, köprü ve tünel geçiş ücretlerini Karayolları Genel Müdürlüğü'nün (KGM) resmi tarifelerinden hesaplayan ücretsiz araç. Ücretler TL, KDV dahil; araç sınıfları 1 (otomobil) – 6 (motosiklet).",
    "",
    "Rota sayfalarının adresi şu biçimdedir: " + `${SITE_URL}/<nereden>-<nereye>-otoyol-ucreti (ör. ${SITE_URL}/istanbul-ankara-otoyol-ucreti).`,
    "",
    "## Popüler rotalar (otomobil, en hızlı rota)",
    ...featuredRoutes().map((r) => `- [${r.from} → ${r.to}](${SITE_URL}${r.href}): ${tl(r.total)}, yaklaşık ${r.km} km`),
    "",
    "## Köprü ve tünel ücretleri (otomobil, tek geçiş)",
    ...getCrossings()
      .filter((c) => c.prices[0] > 0)
      .map((c) => `- ${c.name}: ${tl(c.prices[0])}${(c as { validFrom?: string }).validFrom ? ` (tarife: ${(c as { validFrom?: string }).validFrom})` : ""}`),
    "",
    "## Otoyol tarifeleri",
    ...getHighways().map((h) => `- [${h.name}](${SITE_URL}/otoyol-ucretleri/${h.code.toLowerCase()}): ${h.stations.length} gişe, tarife ${h.validFrom}`),
    "",
    "## Rehberler",
    ...GUIDES.map((g) => `- [${g.title}](${SITE_URL}/rehber/${g.slug}): ${g.description}`),
    "",
    "## Yöntem",
    `- [Veri kaynakları ve hesaplama yöntemi](${SITE_URL}/veri-kaynaklari)`,
    "",
  ];
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

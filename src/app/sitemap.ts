import type { MetadataRoute } from "next";
import { getCrossings, getHighways } from "@/lib/engine";
import { routeSlug } from "@/lib/engine/slugs";
import { popularPairs } from "@/lib/routes";
import { GUIDES } from "@/content/guides";
import { LAST_DATA_CHECK, SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const dataDate = new Date(
    [LAST_DATA_CHECK, ...getHighways().map((h) => h.validFrom), ...getCrossings().map((c) => (c as { validFrom?: string }).validFrom ?? "")]
      .sort()
      .at(-1)!,
  );
  const u = (path: string, priority: number, lastModified: Date = dataDate): MetadataRoute.Sitemap[number] => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    priority,
  });
  return [
    u("/", 1),
    u("/otoyol-ucretleri", 0.9),
    u("/kopru-ucretleri", 0.9),
    u("/tunel-ucretleri", 0.8),
    u("/feribot-ucretleri", 0.7),
    u("/rotalar", 0.8),
    u("/rehber", 0.6),
    ...GUIDES.map((g) => u(`/rehber/${g.slug}`, 0.6, new Date(g.updated))),
    ...getHighways().map((h) => u(`/otoyol-ucretleri/${h.code.toLowerCase()}`, 0.8)),
    ...popularPairs().map(([a, b]) => u(`/${routeSlug(a.id, b.id)}`, 0.7)),
    u("/veri-kaynaklari", 0.4),
    u("/hakkimizda", 0.3),
    u("/iletisim", 0.3),
    u("/gizlilik-politikasi", 0.1),
    u("/cerez-politikasi", 0.1),
    u("/kullanim-kosullari", 0.1),
  ];
}

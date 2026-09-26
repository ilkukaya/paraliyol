import { ImageResponse } from "next/og";
import { OG_SIZE, OgCard, ogFonts } from "@/lib/og";
import { parseRouteSlug } from "@/lib/engine/slugs";
import { computeTrip } from "@/lib/engine";
import { duration, km, tl } from "@/lib/format";

export const alt = "Rota geçiş ücreti";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ "route-slug": string }> }) {
  const { "route-slug": slug } = await params;
  const pair = parseRouteSlug(slug);
  const trip = pair ? computeTrip(pair.from.id, pair.to.id) : null;
  const f = trip?.byClass["1"].fastest;
  return new ImageResponse(
    pair && f ? (
      <OgCard
        kicker="OTOYOL VE KÖPRÜ ÜCRETİ · OTOMOBİL"
        title={`${pair.from.name} → ${pair.to.name}`}
        price={tl(f.total)}
        footer={`${km(f.km)} · ${duration(f.minutes)} · ${f.tolls.length} ücretli geçiş`}
      />
    ) : (
      <OgCard kicker="PARALIYOL" title="Otoyol ücreti hesaplama" footer="Resmi 2026 tarifeleri" />
    ),
    { ...OG_SIZE, fonts: await ogFonts() },
  );
}

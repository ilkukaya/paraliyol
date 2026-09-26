import { ImageResponse } from "next/og";
import { OG_SIZE, OgCard, ogFonts } from "@/lib/og";

export const alt = "Paralıyol – Otoyol ve köprü ücreti hesaplama";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <OgCard kicker="OTOYOL · KÖPRÜ · TÜNEL" title="Yola çıkmadan geçiş ücretini bilin." footer="Resmi 2026 tarifeleriyle hesaplayın" />,
    { ...OG_SIZE, fonts: await ogFonts() },
  );
}

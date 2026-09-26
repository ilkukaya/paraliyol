import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const OG_SIZE = { width: 1200, height: 630 };

export async function ogFonts() {
  const load = (f: string) => readFile(join(process.cwd(), "assets/og", f));
  const [b, be, x, xe] = await Promise.all([
    load("inter-latin-700-normal.woff"),
    load("inter-latin-ext-700-normal.woff"),
    load("inter-latin-800-normal.woff"),
    load("inter-latin-ext-800-normal.woff"),
  ]);
  return [
    { name: "Inter", data: b, weight: 700 as const, style: "normal" as const },
    { name: "Inter", data: be, weight: 700 as const, style: "normal" as const },
    { name: "Inter", data: x, weight: 800 as const, style: "normal" as const },
    { name: "Inter", data: xe, weight: 800 as const, style: "normal" as const },
  ];
}

/** Green motorway-sign card used by every social preview image. */
export function OgCard({ kicker, title, price, footer }: { kicker: string; title: string; price?: string; footer: string }) {
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", background: "#f5f4ef", padding: 36, fontFamily: "Inter" }}>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0b6e44",
          borderRadius: 36,
          padding: 12,
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            border: "5px solid white",
            borderRadius: 28,
            padding: "44px 56px",
            color: "white",
          }}
        >
          <div style={{ display: "flex", fontSize: 30, fontWeight: 700, color: "#cfeadb", letterSpacing: 2 }}>{kicker}</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: title.length > 34 ? 60 : 76, fontWeight: 800, lineHeight: 1.05 }}>{title}</div>
            {price && <div style={{ display: "flex", marginTop: 18, fontSize: 96, fontWeight: 800, color: "#fbc62c" }}>{price}</div>}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 28, fontWeight: 700 }}>
            <span>{footer}</span>
            <span style={{ display: "flex", color: "#fbc62c" }}>paralıyol</span>
          </div>
        </div>
      </div>
    </div>
  );
}

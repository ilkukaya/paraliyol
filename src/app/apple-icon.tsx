import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#0b6e44", padding: 14 }}>
        <div style={{ flex: 1, display: "flex", border: "8px solid white", borderRadius: 30, alignItems: "center", justifyContent: "center", position: "relative" }}>
          <div style={{ display: "flex", width: 54, height: 104, borderLeft: "11px solid white", borderRight: "11px solid white" }} />
          <div style={{ position: "absolute", display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ width: 8, height: 18, background: "#f2b705", borderRadius: 4 }} />
            <div style={{ width: 8, height: 18, background: "#f2b705", borderRadius: 4 }} />
            <div style={{ width: 8, height: 18, background: "#f2b705", borderRadius: 4 }} />
          </div>
        </div>
      </div>
    ),
    size,
  );
}

import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#0b6e44", borderRadius: 112, padding: 36 }}>
        <div style={{ flex: 1, display: "flex", border: "22px solid white", borderRadius: 80, alignItems: "center", justifyContent: "center", position: "relative" }}>
          <div style={{ display: "flex", width: 150, height: 300, borderLeft: "30px solid white", borderRight: "30px solid white" }} />
          <div style={{ position: "absolute", display: "flex", flexDirection: "column", gap: 26 }}>
            <div style={{ width: 22, height: 50, background: "#f2b705", borderRadius: 11 }} />
            <div style={{ width: 22, height: 50, background: "#f2b705", borderRadius: 11 }} />
            <div style={{ width: 22, height: 50, background: "#f2b705", borderRadius: 11 }} />
          </div>
        </div>
      </div>
    ),
    size,
  );
}

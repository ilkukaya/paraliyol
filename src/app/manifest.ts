import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Paralıyol – Otoyol ve Köprü Ücreti Hesaplama",
    short_name: "Paralıyol",
    description: "Türkiye otoyol, köprü ve tünel geçiş ücretlerini resmi tarifelerle hesaplayın.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f4ef",
    theme_color: "#0b6e44",
    lang: "tr",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}

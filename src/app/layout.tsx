import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/bricolage-grotesque";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Consent, { consentDefaultsScript } from "@/components/Consent";
import JsonLd from "@/components/JsonLd";
import { themeScript } from "@/components/ThemeToggle";
import { ADSENSE_CLIENT, GA_ID, SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/site";

const description =
  "Türkiye'deki tüm otoyol, köprü ve tünel geçiş ücretlerini KGM'nin resmi 2026 tarifeleriyle hesaplayın. Gişe gişe döküm, araç sınıfları, gidiş-dönüş ve yakıt maliyeti.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Otoyol ve Köprü Ücreti Hesaplama 2026 | Paralıyol",
    template: "%s | Paralıyol",
  },
  description,
  applicationName: SITE_NAME,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: SITE_NAME,
    url: "/",
    title: "Otoyol ve Köprü Ücreti Hesaplama 2026",
    description,
  },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false },
  robots: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION || undefined,
    other: process.env.NEXT_PUBLIC_BING_VERIFICATION ? { "msvalidate.01": process.env.NEXT_PUBLIC_BING_VERIFICATION } : undefined,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f4ef" },
    { media: "(prefers-color-scheme: dark)", color: "#0c1511" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script dangerouslySetInnerHTML={{ __html: consentDefaultsScript }} />
        <link rel="preconnect" href="https://tile.openstreetmap.org" crossOrigin="" />
      </head>
      <body className="flex min-h-dvh flex-col">
        <a href="#icerik" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-lane-400 focus:px-4 focus:py-2 focus:font-bold">
          İçeriğe geç
        </a>
        <SiteHeader />
        <main id="icerik" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        <Consent gaId={GA_ID} adsenseClient={ADSENSE_CLIENT} />
        <JsonLd
          data={[
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              "@id": absoluteUrl("/#organization"),
              name: SITE_NAME,
              url: SITE_URL,
              logo: absoluteUrl("/icon.png"),
            },
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              "@id": absoluteUrl("/#website"),
              name: SITE_NAME,
              url: SITE_URL,
              inLanguage: "tr-TR",
              publisher: { "@id": absoluteUrl("/#organization") },
            },
          ]}
        />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CookieConsent from "@/components/CookieConsent";

export const metadata: Metadata = {
  title: "Paralıyol - Türkiye Otoyol Ücret Hesaplama",
  description:
    "Türkiye'deki tüm otoyol, köprü, tünel ve feribot geçiş ücretlerini hesaplayın. A noktasından B noktasına toplam geçiş ücretini anında öğrenin.",
  metadataBase: new URL("https://paraliyol.netlify.app"),
  openGraph: {
    title: "Paralıyol - Türkiye Otoyol Ücret Hesaplama",
    description:
      "Türkiye'deki tüm otoyol, köprü, tünel ve feribot geçiş ücretlerini hesaplayın.",
    locale: "tr_TR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="bg-gray-50 text-gray-900 min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <CookieConsent />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { getSiteSettings } from "./data-loader";

const settings = getSiteSettings();

export function generatePageMetadata(
  title: string,
  description: string,
  path: string = ""
): Metadata {
  const fullTitle = `${title} ${settings.seoDefaults.titleSuffix}`;
  const url = `https://paraliyol.netlify.app${path}`;

  return {
    title: fullTitle,
    description,
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: settings.siteName,
      locale: "tr_TR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
    },
    alternates: {
      canonical: url,
    },
  };
}

export function generateRouteMetadata(
  fromName: string,
  toName: string,
  price: number,
  slug: string
): Metadata {
  const title = `${fromName} - ${toName} Otoyol Ücreti 2026`;
  const description = `${fromName} - ${toName} arası otoyol geçiş ücreti ${price} TL (1. sınıf araç, 2026). Tüm gişe, köprü ve tünel ücretlerinin detaylı dökümü.`;
  return generatePageMetadata(title, description, `/${slug}`);
}

export function generateFAQSchema(
  questions: { question: string; answer: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.answer,
      },
    })),
  };
}

export function generateBreadcrumbSchema(
  items: { name: string; url: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `https://paraliyol.netlify.app${item.url}`,
    })),
  };
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProsePage from "@/components/ProsePage";
import JsonLd from "@/components/JsonLd";
import AdSlot from "@/components/AdSlot";
import { GUIDES } from "@/content/guides";
import { trDate } from "@/lib/format";
import { absoluteUrl, SITE_NAME } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => GUIDES.map((g) => ({ slug: g.slug }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const g = GUIDES.find((x) => x.slug === slug);
  if (!g) return {};
  return {
    title: g.title,
    description: g.description,
    alternates: { canonical: `/rehber/${g.slug}` },
    openGraph: { type: "article", title: g.title, description: g.description, publishedTime: g.published, modifiedTime: g.updated },
  };
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const g = GUIDES.find((x) => x.slug === slug);
  if (!g) notFound();
  const others = GUIDES.filter((x) => x.slug !== g.slug);
  return (
    <>
      <ProsePage title={g.title} path={`/rehber/${g.slug}`} crumbs={[{ name: "Rehber", href: "/rehber" }]} updated={trDate(g.updated)}>
        {g.body()}
        <AdSlot position="bottom" />
        <h2>Diğer rehberler</h2>
        <ul>
          {others.map((o) => (
            <li key={o.slug}>
              <Link href={`/rehber/${o.slug}`}>{o.title}</Link>
            </li>
          ))}
        </ul>
      </ProsePage>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: g.title,
          description: g.description,
          datePublished: g.published,
          dateModified: g.updated,
          inLanguage: "tr-TR",
          mainEntityOfPage: absoluteUrl(`/rehber/${g.slug}`),
          author: { "@type": "Organization", name: SITE_NAME, url: absoluteUrl("/") },
          publisher: { "@id": absoluteUrl("/#organization") },
        }}
      />
    </>
  );
}

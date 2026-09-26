import Link from "next/link";
import JsonLd from "./JsonLd";
import { absoluteUrl } from "@/lib/site";

export default function Breadcrumbs({ items }: { items: { name: string; href: string }[] }) {
  const all = [{ name: "Ana sayfa", href: "/" }, ...items];
  return (
    <>
      <nav aria-label="Konum" className="muted mb-4 text-sm">
        <ol className="flex flex-wrap items-center gap-1.5">
          {all.map((item, i) => (
            <li key={item.href} className="flex items-center gap-1.5">
              {i > 0 && <span aria-hidden>/</span>}
              {i === all.length - 1 ? (
                <span aria-current="page" className="text-[var(--fg)]">{item.name}</span>
              ) : (
                <Link href={item.href} className="hover:text-[var(--fg)] hover:underline">
                  {item.name}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: all.map((item, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: item.name,
            item: absoluteUrl(item.href),
          })),
        }}
      />
    </>
  );
}

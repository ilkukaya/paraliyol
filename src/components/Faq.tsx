import JsonLd from "./JsonLd";

export interface FaqItem {
  q: string;
  a: string;
}

export default function Faq({ items, title = "Sık sorulan sorular" }: { items: FaqItem[]; title?: string }) {
  return (
    <section aria-labelledby="sss" className="mt-12">
      <h2 id="sss" className="text-2xl font-bold">{title}</h2>
      <div className="card mt-5 divide-y divide-[var(--border)]">
        {items.map((f) => (
          <details key={f.q} className="group px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-semibold">
              <h3 className="text-base font-semibold" style={{ fontFamily: "var(--font-sans)", letterSpacing: 0 }}>{f.q}</h3>
              <span aria-hidden className="mt-0.5 text-xl leading-none text-sign-600 transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="muted mt-3 leading-7">{f.a}</p>
          </details>
        ))}
      </div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: items.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }}
      />
    </section>
  );
}

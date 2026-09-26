import type { AffiliateLink } from "@/lib/affiliates";

export default function TravelLinks({ links }: { links: AffiliateLink[] }) {
  if (!links.length) return null;
  const sponsored = links.some((l) => l.sponsored);
  return (
    <section className="card p-5" aria-labelledby="yolculuk">
      <h2 id="yolculuk" className="text-lg font-bold">Yolculuğunuzu planlayın</h2>
      <ul className="mt-3 space-y-3">
        {links.map((l) => (
          <li key={l.id}>
            <a
              href={l.href}
              target="_blank"
              rel={`noopener ${l.sponsored ? "sponsored nofollow" : "nofollow"}`}
              className="group flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] p-3.5 hover:border-sign-400"
            >
              <span>
                <span className="block font-semibold">{l.title}</span>
                <span className="muted block text-sm">{l.text}</span>
              </span>
              <span className="shrink-0 rounded-lg bg-sign-50 px-3 py-2 text-sm font-bold text-sign-700 group-hover:bg-sign-100 dark:bg-sign-900 dark:text-sign-100">
                {l.cta}
              </span>
            </a>
          </li>
        ))}
      </ul>
      {sponsored && <p className="muted mt-3 text-xs">Bu bağlantılar üzerinden yapılan rezervasyonlardan komisyon alabiliriz; size ek maliyeti yoktur.</p>}
    </section>
  );
}

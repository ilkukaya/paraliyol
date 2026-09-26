import { VEHICLE_CLASSES } from "@/lib/engine/types";
import type { BridgeData } from "@/lib/engine/types";
import { tl, trDate, VEHICLE_LABELS } from "@/lib/format";

export default function CrossingCard({ c }: { c: BridgeData & { validFrom?: string } }) {
  const known = c.prices.some((p) => p > 0);
  return (
    <section id={c.id} className="card scroll-mt-24 overflow-hidden">
      <div className="road-sign rounded-none px-6 py-5 [&::before]:rounded-none">
        <h2 className="font-display text-2xl font-extrabold">{c.name}</h2>
        {c.operator && <p className="mt-1 text-sm text-sign-100">İşletmeci: {c.operator}</p>}
      </div>
      <div className="p-5">
        {c.description && <p className="leading-7">{c.description}</p>}
        {known ? (
          <table className="num mt-4 w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--fg-muted)]">
                <th className="py-2 font-semibold">Araç sınıfı</th>
                <th className="py-2 text-right font-semibold">Ücret</th>
              </tr>
            </thead>
            <tbody>
              {VEHICLE_CLASSES.map((vc, i) => (
                <tr key={vc} className="border-t border-[var(--border)]">
                  <td className="py-2.5">
                    <span className="font-semibold">{VEHICLE_LABELS[vc].long}</span> <span className="muted">· {VEHICLE_LABELS[vc].short}</span>
                  </td>
                  <td className="py-2.5 text-right font-bold">
                    {c.allowedClasses && !c.allowedClasses.includes(vc) ? (
                      <span className="muted font-medium">Geçemez</span>
                    ) : c.prices[i] > 0 ? (
                      tl(c.prices[i])
                    ) : (
                      <span className="muted font-medium">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="mt-4 rounded-xl bg-[var(--surface-2)] p-4 text-sm">
            Bu hat için doğrulanmış güncel tarife bulunmuyor. Ücret ve sefer saatlerini işletmecinin sitesinden kontrol edin.
          </p>
        )}
        {c.rules && c.rules.length > 0 && (
          <ul className="muted mt-4 list-disc space-y-1.5 pl-5 text-sm leading-6">
            {c.rules.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        )}
        <p className="muted mt-4 text-xs">
          {c.validFrom ? `Tarife tarihi: ${trDate(c.validFrom)}. ` : ""}
          {c.verified === false ? "Kaynak: basın / işletmeci duyuruları — " : "Kaynak: "}
          {c.source?.startsWith("http") ? (
            <a href={c.source} rel="nofollow noopener" target="_blank" className="underline">
              {new URL(c.source).hostname}
            </a>
          ) : (
            "KGM resmi tarife dosyası"
          )}
        </p>
      </div>
    </section>
  );
}

import type { Metadata } from "next";
import { getCrossings } from "@/lib/engine";
import Breadcrumbs from "@/components/Breadcrumbs";
import CrossingCard from "@/components/CrossingCard";

export const metadata: Metadata = {
  title: "Arabalı Feribot Ücretleri 2026 – Eskihisar, Çanakkale, Gelibolu",
  description: "Eskihisar–Topçular, Çanakkale–Eceabat ve Gelibolu–Lapseki arabalı feribot hatları: 2026 araç ücretleri, işletmeciler ve köprü alternatifleri.",
  alternates: { canonical: "/feribot-ucretleri" },
};

export default function FerryPage() {
  const ferries = getCrossings().filter((c) => c.type === "ferry");
  return (
    <div className="mx-auto max-w-4xl px-4 pb-10 pt-6">
      <Breadcrumbs items={[{ name: "Feribot ücretleri", href: "/feribot-ucretleri" }]} />
      <h1 className="font-display text-3xl font-extrabold sm:text-5xl">Arabalı feribot ücretleri 2026</h1>
      <p className="muted mt-3 text-lg leading-8">
        Feribot tarifeleri KGM tarafından değil, hattı işleten şirketler tarafından belirlenir ve sık değişebilir. Aşağıdaki bilgiler
        işletmeci ve basın duyurularından derlenmiştir; yola çıkmadan işletmecinin güncel tarifesini kontrol etmenizi öneririz.
      </p>
      <div className="mt-8 space-y-6">
        {ferries.map((f) => (
          <CrossingCard key={f.id} c={f} />
        ))}
      </div>
    </div>
  );
}

import Link from "next/link";
import Logo from "./Logo";
import { LAST_DATA_CHECK } from "@/lib/site";
import { trDate } from "@/lib/format";

const cols = [
  {
    title: "Ücretler",
    links: [
      ["/otoyol-ucretleri", "Otoyol ücretleri"],
      ["/kopru-ucretleri", "Köprü ücretleri"],
      ["/tunel-ucretleri", "Avrasya Tüneli"],
      ["/feribot-ucretleri", "Feribot ücretleri"],
      ["/rotalar", "Tüm rotalar"],
    ],
  },
  {
    title: "Rehber",
    links: [
      ["/rehber/hgs-nedir-nasil-alinir", "HGS nedir, nasıl alınır?"],
      ["/rehber/ihlalli-gecis-cezasi", "İhlalli geçiş cezası"],
      ["/rehber/arac-siniflari", "Araç sınıfları"],
      ["/rehber/yol-masrafi-hesaplama", "Yol masrafı hesaplama"],
    ],
  },
  {
    title: "Paralıyol",
    links: [
      ["/hakkimizda", "Hakkımızda"],
      ["/veri-kaynaklari", "Veri kaynakları ve yöntem"],
      ["/iletisim", "İletişim"],
      ["/gizlilik-politikasi", "Gizlilik ve KVKK"],
      ["/cerez-politikasi", "Çerez politikası"],
      ["/kullanim-kosullari", "Kullanım koşulları"],
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="lane-divider opacity-70" />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="muted mt-4 max-w-xs text-sm leading-6">
            Türkiye&apos;deki otoyol, köprü ve tünel geçiş ücretlerini Karayolları Genel Müdürlüğü&apos;nün
            resmi tarifelerinden hesaplayan bağımsız ve ücretsiz bir araç.
          </p>
          <p className="muted mt-4 text-xs">Veriler en son {trDate(LAST_DATA_CHECK)} tarihinde kontrol edildi.</p>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <h2 className="font-display text-sm font-bold uppercase tracking-wider">{c.title}</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {c.links.map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="muted hover:text-[var(--fg)]">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-[var(--border)]">
        <p className="muted mx-auto max-w-6xl px-4 py-5 text-xs leading-5">
          © {new Date().getFullYear()} Paralıyol. Ücretler bilgilendirme amaçlıdır; gişede tahsil edilen tutar esastır.
          Paralıyol, KGM veya herhangi bir otoyol işletmecisi ile bağlantılı değildir.
        </p>
      </div>
    </footer>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import ProsePage from "@/components/ProsePage";

export const metadata: Metadata = {
  title: "Hakkımızda",
  description: "Paralıyol, Türkiye'deki otoyol, köprü ve tünel geçiş ücretlerini resmi tarifelerden hesaplayan bağımsız ve ücretsiz bir araçtır.",
  alternates: { canonical: "/hakkimizda" },
};

export default function AboutPage() {
  return (
    <ProsePage title="Hakkımızda" path="/hakkimizda" lead="Yola çıkmadan önce ne ödeyeceğinizi bilmeniz için.">
      <p>
        Paralıyol, Türkiye&apos;de şehirler arası yolculuk yapan herkesin otoyol, köprü ve tünel geçiş ücretlerini kolayca
        öğrenebilmesi için hazırlanmış bağımsız ve ücretsiz bir hesaplama aracıdır. Tek bir aramayla rotanızdaki tüm ücretli geçişleri,
        araç sınıfınıza göre toplam tutarı, ücretsiz alternatif güzergâhı ve yakıt dahil yol masrafını görebilirsiniz.
      </p>
      <h2>İlkelerimiz</h2>
      <ul>
        <li><strong>Resmi veri:</strong> Ücretleri Karayolları Genel Müdürlüğü&apos;nün yayımladığı tarifelerden alırız ve her gün kontrol ederiz.</li>
        <li><strong>Şeffaflık:</strong> Her hesaplamada kullanılan tarife tarihini gösteririz. Yöntemimizi <Link href="/veri-kaynaklari">veri kaynakları</Link> sayfasında anlatıyoruz.</li>
        <li><strong>Ücretsiz ve üyeliksiz:</strong> Site reklam ve iş ortaklığı gelirleriyle ayakta durur; hesaplama için hiçbir kişisel bilgi istemeyiz.</li>
      </ul>
      <p>
        Paralıyol; KGM, PTT veya herhangi bir otoyol, köprü ya da tünel işletmecisiyle bağlantılı değildir. Görüş ve önerileriniz için{" "}
        <Link href="/iletisim">iletişim</Link> sayfamızı kullanabilirsiniz.
      </p>
    </ProsePage>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import ProsePage from "@/components/ProsePage";

export const metadata: Metadata = {
  title: "Gizlilik Politikası ve KVKK Aydınlatma Metni",
  description: "Paralıyol gizlilik politikası ve 6698 sayılı KVKK kapsamında aydınlatma metni.",
  alternates: { canonical: "/gizlilik-politikasi" },
};

export default function PrivacyPage() {
  return (
    <ProsePage title="Gizlilik politikası ve KVKK aydınlatma metni" path="/gizlilik-politikasi" updated="26 Eylül 2026">
      <p>
        Bu metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında Paralıyol (&quot;site&quot;) ziyaretçilerini hangi
        verilerin, hangi amaçla ve nasıl işlendiği konusunda bilgilendirmek için hazırlanmıştır.
      </p>
      <h2>İşlenen veriler</h2>
      <ul>
        <li><strong>Hesaplama verileri:</strong> Seçtiğiniz başlangıç, varış ve araç sınıfı yalnızca sonucu göstermek için kullanılır; hesabınız veya kimliğinizle ilişkilendirilmez.</li>
        <li><strong>Tarayıcıda saklanan tercihler:</strong> Tema, çerez tercihi ve yakıt fiyatı gibi ayarlar yalnızca kendi cihazınızda (localStorage) saklanır.</li>
        <li><strong>İletişim formu:</strong> Formu doldurursanız adınız, e-posta adresiniz ve mesajınız size yanıt vermek amacıyla işlenir.</li>
        <li><strong>Teknik kayıtlar:</strong> Barındırma sağlayıcımız (Netlify) güvenlik ve hizmetin sürekliliği için IP adresi ve istek bilgileri gibi sunucu kayıtlarını tutabilir.</li>
        <li><strong>Analiz ve reklam çerezleri:</strong> Yalnızca açık rızanız varsa Google Analytics ve Google AdSense çerezleri kullanılır. Ayrıntılar <Link href="/cerez-politikasi">Çerez Politikası</Link>&apos;ndadır.</li>
      </ul>
      <h2>İşleme amaçları ve hukuki sebepler</h2>
      <p>
        Veriler; hizmetin sunulması ve güvenliği (KVKK m.5/2-f meşru menfaat), iletişim taleplerinin yanıtlanması (m.5/2-c) ve
        rızanıza bağlı analiz ile reklam faaliyetleri (m.5/1 açık rıza) amaçlarıyla işlenir.
      </p>
      <h2>Aktarım</h2>
      <p>
        Hizmetin sunulması için veriler, sunucuları yurt dışında bulunabilen hizmet sağlayıcılarımıza (Netlify, Google) aktarılabilir.
        Analiz ve reklam çerezlerine ilişkin aktarım yalnızca açık rızanızla yapılır.
      </p>
      <h2>Haklarınız</h2>
      <p>
        KVKK&apos;nın 11. maddesi uyarınca verilerinizin işlenip işlenmediğini öğrenme, bilgi talep etme, düzeltilmesini veya silinmesini
        isteme ve itiraz etme haklarına sahipsiniz. Taleplerinizi <Link href="/iletisim">iletişim</Link> sayfası üzerinden
        iletebilirsiniz.
      </p>
    </ProsePage>
  );
}

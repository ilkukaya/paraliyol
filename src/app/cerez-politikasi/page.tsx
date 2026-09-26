import type { Metadata } from "next";
import ProsePage from "@/components/ProsePage";
import { ConsentSettingsButton } from "@/components/Consent";

export const metadata: Metadata = {
  title: "Çerez Politikası",
  description: "Paralıyol'da kullanılan çerezler, amaçları ve çerez tercihlerinizi nasıl değiştirebileceğiniz.",
  alternates: { canonical: "/cerez-politikasi" },
};

export default function CookiePage() {
  return (
    <ProsePage title="Çerez politikası" path="/cerez-politikasi" updated="26 Eylül 2026">
      <p>Çerezler, ziyaret ettiğiniz sitelerin tarayıcınıza kaydettiği küçük metin dosyalarıdır. Paralıyol&apos;da çerezleri aşağıdaki amaçlarla kullanırız.</p>
      <h2>Zorunlu olanlar</h2>
      <p>Çerez tercihiniz ve tema ayarınız gibi sitenin çalışması için gereken bilgiler tarayıcınızda saklanır. Bunlar kapatılamaz ve kişisel veri içermez.</p>
      <h2>Analiz çerezleri (rızaya bağlı)</h2>
      <p>İzin verirseniz Google Analytics ile sayfaların nasıl kullanıldığını anonim istatistikler halinde ölçeriz.</p>
      <h2>Reklam çerezleri (rızaya bağlı)</h2>
      <p>
        Site, ücretsiz kalabilmek için Google AdSense reklamları gösterebilir. İzin vermezseniz reklamlar kişiselleştirilmeden gösterilir.
        Google&apos;ın reklam çerezlerini nasıl kullandığını{" "}
        <a href="https://policies.google.com/technologies/ads?hl=tr" rel="nofollow noopener" target="_blank">buradan</a> inceleyebilirsiniz.
      </p>
      <h2>Tercihlerinizi değiştirme</h2>
      <p>
        <ConsentSettingsButton /> Ayrıca tarayıcı ayarlarınızdan çerezleri silebilir veya engelleyebilirsiniz.
      </p>
    </ProsePage>
  );
}

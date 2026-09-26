# KGM tarife PDF'leri

Bu klasördeki dosyalar Karayolları Genel Müdürlüğü'nün resmi geçiş ücreti tarifeleridir:
https://www.kgm.gov.tr/Sayfalar/KGM/SiteTr/Otoyollar/UcretlerYeni.aspx

Normalde elle bir şey yapmanıza gerek yoktur: `.github/workflows/sync-tolls.yml` her gün
PDF'leri KGM'den indirir, `scripts/kgm/parsers/` altındaki ayrıştırıcılarla okur ve
`data/tolls/*.json` dosyalarını günceller.

KGM sitesine erişilemezse güncel PDF'leri buraya aynı dosya adlarıyla yükleyip
`npm run sync-tolls` çalıştırabilirsiniz.

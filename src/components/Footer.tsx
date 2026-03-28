import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-12">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-bold text-gray-900 mb-3">Paraliyol</h3>
            <p className="text-sm text-gray-600">
              Türkiye&apos;deki tüm otoyol, köprü, tünel ve feribot geçiş
              ücretlerini hesaplayın.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 mb-3">Geçiş Ücretleri</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/otoyol-ucretleri"
                  className="text-gray-600 hover:text-green-700"
                >
                  Otoyol Ücretleri
                </Link>
              </li>
              <li>
                <Link
                  href="/kopru-ucretleri"
                  className="text-gray-600 hover:text-green-700"
                >
                  Köprü Ücretleri
                </Link>
              </li>
              <li>
                <Link
                  href="/tunel-ucretleri"
                  className="text-gray-600 hover:text-green-700"
                >
                  Tünel Ücretleri
                </Link>
              </li>
              <li>
                <Link
                  href="/feribot-ucretleri"
                  className="text-gray-600 hover:text-green-700"
                >
                  Feribot Ücretleri
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 mb-3">Bilgi</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/hakkimizda"
                  className="text-gray-600 hover:text-green-700"
                >
                  Hakkımızda
                </Link>
              </li>
              <li>
                <Link
                  href="/gizlilik-politikasi"
                  className="text-gray-600 hover:text-green-700"
                >
                  Gizlilik Politikası
                </Link>
              </li>
              <li>
                <Link
                  href="/cerez-politikasi"
                  className="text-gray-600 hover:text-green-700"
                >
                  Çerez Politikası
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-200 mt-8 pt-6 text-center text-sm text-gray-500">
          <p>&copy; {currentYear} Paraliyol. Tüm hakları saklıdır.</p>
          <p className="mt-1">
            Ücretler bilgi amaçlıdır. Güncel ücretler için ilgili kurum
            sitelerini kontrol ediniz.
          </p>
        </div>
      </div>
    </footer>
  );
}

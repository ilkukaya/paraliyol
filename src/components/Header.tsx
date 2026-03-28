import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold text-green-700">Paraliyol</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link
            href="/otoyol-ucretleri"
            className="text-gray-600 hover:text-green-700 transition-colors"
          >
            Otoyol Ücretleri
          </Link>
          <Link
            href="/kopru-ucretleri"
            className="text-gray-600 hover:text-green-700 transition-colors"
          >
            Köprü Ücretleri
          </Link>
          <Link
            href="/tunel-ucretleri"
            className="text-gray-600 hover:text-green-700 transition-colors"
          >
            Tünel Ücretleri
          </Link>
          <Link
            href="/feribot-ucretleri"
            className="text-gray-600 hover:text-green-700 transition-colors"
          >
            Feribot Ücretleri
          </Link>
        </nav>
        <button className="md:hidden text-gray-600" id="mobile-menu-btn">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>
    </header>
  );
}

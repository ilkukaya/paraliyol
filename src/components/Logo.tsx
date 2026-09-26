export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  // Otoyol levhası: yeşil kalkan, beyaz çerçeve, yol ve ₺ işareti
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect x="1" y="1" width="38" height="38" rx="9" fill="#0b6e44" />
      <rect x="4" y="4" width="32" height="32" rx="6.5" fill="none" stroke="#fff" strokeWidth="1.8" />
      <path d="M15.5 31 19 9h2l3.5 22" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M20 13.5v2.6M20 19v2.6M20 24.5v2.6" stroke="#f2b705" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      <span className="font-display text-[1.35rem] font-extrabold leading-none tracking-tight">
        Paralı<span className="text-sign-600 dark:text-sign-300">yol</span>
      </span>
    </span>
  );
}

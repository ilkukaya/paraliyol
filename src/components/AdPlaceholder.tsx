interface AdPlaceholderProps {
  slot: string;
  className?: string;
}

export default function AdPlaceholder({
  slot,
  className = "",
}: AdPlaceholderProps) {
  return (
    <div
      id={`ad-${slot}`}
      className={`min-h-[90px] flex items-center justify-center ${className}`}
      data-ad-slot={slot}
    >
      {/* Ad scripts will be injected by Ezoic/AdSense */}
    </div>
  );
}

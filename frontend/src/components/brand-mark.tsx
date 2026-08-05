import Link from "next/link";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link className="brand-mark" href="/" aria-label="Wellyura home">
      <span className="brand-symbol" aria-hidden="true">
        <span className="brand-orbit" />
        <span className="brand-dot" />
      </span>
      {!compact && <span>Wellyura</span>}
    </Link>
  );
}

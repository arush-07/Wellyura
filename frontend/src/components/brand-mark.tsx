import Image from "next/image";
import Link from "next/link";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link className="brand-mark" href="/" aria-label="Wellyura home">
      <Image
        className="brand-logo-icon"
        src="/brand/wellyura-logo.png"
        alt=""
        width={60}
        height={60}
        priority
        aria-hidden="true"
      />

      {!compact && <span>Wellyura</span>}
    </Link>
  );
}

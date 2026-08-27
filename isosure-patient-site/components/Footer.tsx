import Link from "next/link";
import { BRAND } from "@/lib/brand";

export function Footer() {
  return (
    <footer className="mt-auto bg-purple-deep text-white">
      <div className="mx-auto grid max-w-6xl items-center gap-6 px-4 py-10 md:grid-cols-[220px_1fr_1fr]">
        <img src={BRAND.logoInverse} alt={BRAND.legalName} className="h-24 w-auto" />
        <div className="text-sm text-purple-soft">
          <p className="text-white">{BRAND.legalName}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.12em]">{BRAND.tagline}</p>
          <p className="mt-2">
            {BRAND.phone} · {BRAND.email}
          </p>
        </div>
        <div className="text-sm text-purple-soft">
          <p>
            Two systems, one store: the provider portal is a thin client; Operations is the LIMS/MOM
            for MFR, compounding records, BUD, inventory, and environment logs.
          </p>
          <Link href="/ops" className="mt-3 inline-block underline underline-offset-4">
            Open Operations
          </Link>
        </div>
      </div>
    </footer>
  );
}

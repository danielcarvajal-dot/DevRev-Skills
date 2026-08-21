import Link from "next/link";
import { BRAND } from "@/lib/brand";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-line bg-forest-deep text-paper">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <p className="serif text-xl tracking-[0.16em]">{BRAND.name}</p>
          <p className="mt-2 max-w-xs text-sm text-paper/75">{BRAND.tagline}</p>
        </div>
        <div className="text-sm text-paper/80">
          <p>{BRAND.addressLine1}</p>
          <p>{BRAND.addressLine2}</p>
          <p className="mt-2">{BRAND.phone}</p>
          <p>{BRAND.email}</p>
          <p className="mt-2">{BRAND.hours}</p>
        </div>
        <div className="text-sm text-paper/70">
          <p>This is a prototype catalog. Compounded medicines require a valid prescription and are not available for sale here.</p>
          <div className="mt-4 flex gap-4">
            <Link href="/catalog" className="underline decoration-brass underline-offset-4">
              Browse compounds
            </Link>
            <Link href="/account" className="underline decoration-brass underline-offset-4">
              Patient profile
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

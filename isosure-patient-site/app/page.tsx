import Link from "next/link";
import { BRAND } from "@/lib/brand";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <section className="grid items-center gap-6 rounded-2xl bg-purple-deep px-6 py-10 text-white md:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-soft">
            Practice portal · Phase 1 prototype
          </p>
          <h1 className="mt-2 text-4xl font-semibold leading-tight">
            Doctors order. The {BRAND.name} lab compounds.
          </h1>
          <p className="mt-4 max-w-xl text-purple-soft">
            Write the fill from the formulary, attach the script, and send it to the compounding
            pharmacy. Pharmacy admins manage the medication list and move incoming orders into
            production.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/catalog" className="rounded-lg bg-purple-mid px-4 py-2 text-sm font-semibold">
              Open the formulary
            </Link>
            <Link href="/login" className="rounded-lg border border-white/30 px-4 py-2 text-sm">
              Sign in as practice or pharmacy
            </Link>
          </div>
        </div>
        <img src={BRAND.logoInverse} alt="" className="mx-auto w-full max-w-xs" />
      </section>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Link href="/catalog" className="rounded-xl border border-line bg-paper p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-mid">Doctor / office</p>
          <h2 className="mt-2 text-xl font-semibold">Build an order</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Select a dose on each medication, then attach scripts before checkout.
          </p>
        </Link>
        <Link href="/login" className="rounded-xl border border-line bg-paper p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-mid">Pharmacy admin</p>
          <h2 className="mt-2 text-xl font-semibold">Run the formulary</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Upload a custom list or add, edit, and retire compounds by hand.
          </p>
        </Link>
        <Link href="/admin/orders" className="rounded-xl border border-line bg-paper p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-mid">Phase 2 ready</p>
          <h2 className="mt-2 text-xl font-semibold">Production handoff</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Orders are shaped for the future production website. Nothing ships from this prototype.
          </p>
        </Link>
      </div>
    </div>
  );
}

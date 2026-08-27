import Link from "next/link";
import { BRAND } from "@/lib/brand";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <section className="grid items-center gap-6 rounded-2xl bg-purple-deep px-6 py-10 text-white md:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-soft">
            Provider portal · External thin client
          </p>
          <h1 className="mt-2 text-4xl font-semibold leading-tight">
            Prescribers submit. Operations compounds.
          </h1>
          <p className="mt-4 max-w-xl text-purple-soft">
            The provider portal is a thin client to ISOSure Operations. Submit orders, exchange
            documents, request refills, and read status notifications. Clinical and compounding
            logic stays in the lab — not in this portal.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/ops" className="rounded-lg bg-purple-mid px-4 py-2 text-sm font-semibold">
            Open Operations (lab)
          </Link>
          <Link href="/login" className="rounded-lg bg-purple-mid px-4 py-2 text-sm font-semibold">
              Provider or facility login
            </Link>
            <Link href="/catalog" className="rounded-lg border border-white/30 px-4 py-2 text-sm">
              Start an order
            </Link>
          </div>
        </div>
        <img src={BRAND.logoInverse} alt="" className="mx-auto w-full max-w-xs" />
      </section>
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Link href="/catalog" className="rounded-xl border border-line bg-paper p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-mid">Submit</p>
          <h2 className="mt-2 text-lg font-semibold">Order submission</h2>
          <p className="mt-2 text-sm text-ink-soft">Select published strengths and send the request to Operations.</p>
        </Link>
        <Link href="/account" className="rounded-xl border border-line bg-paper p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-mid">Status</p>
          <h2 className="mt-2 text-lg font-semibold">Order status</h2>
          <p className="mt-2 text-sm text-ink-soft">See only the labels Operations publishes — never compounding steps.</p>
        </Link>
        <Link href="/portal/documents" className="rounded-xl border border-line bg-paper p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-mid">Exchange</p>
          <h2 className="mt-2 text-lg font-semibold">Documents</h2>
          <p className="mt-2 text-sm text-ink-soft">Rx images, PA forms, and patient-specific formulas.</p>
        </Link>
        <Link href="/portal/notifications" className="rounded-xl border border-line bg-paper p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-mid">Alerts</p>
          <h2 className="mt-2 text-lg font-semibold">Notifications</h2>
          <p className="mt-2 text-sm text-ink-soft">Backorder, clarification needed, ready for pickup or delivery.</p>
        </Link>
        <Link href="/ops" className="rounded-xl border border-line bg-paper p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-mid">Lab</p>
          <h2 className="mt-2 text-lg font-semibold">Operations LIMS</h2>
          <p className="mt-2 text-sm text-ink-soft">MFR, CR, BUD, HD flags, lots, and environment logs.</p>
        </Link>
      </div>
    </div>
  );
}

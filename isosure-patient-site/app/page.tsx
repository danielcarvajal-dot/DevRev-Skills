import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { BRAND } from "@/lib/brand";
import { CATEGORIES, featuredProducts } from "@/lib/products";

const STEPS = [
  {
    n: "01",
    title: "Choose a compound",
    copy: "Browse the catalog by therapy area, form, or the strength your prescriber wrote.",
  },
  {
    n: "02",
    title: "Pick the dose",
    copy: "Every listing has multiple strengths so you can match the script exactly.",
  },
  {
    n: "03",
    title: "We compound and ship",
    copy: "The lab prepares your order, then your profile keeps the refill history for next time.",
  },
];

export default function HomePage() {
  return (
    <div>
      <section className="apothecary-grid border-b border-line">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-[1.2fr_0.8fr] md:py-24">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-leaf">Patient portal prototype</p>
            <h1 className="serif mt-3 text-5xl leading-[1.05] md:text-6xl">
              {BRAND.name} prepares the dose your clinician intended.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-ink-soft">{BRAND.tagline} Select a compound, choose a strength, and keep every refill on your profile.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/catalog"
                className="rounded-full bg-forest px-5 py-2.5 text-sm text-paper-strong"
              >
                Browse the catalog
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-forest px-5 py-2.5 text-sm"
              >
                Open a patient profile
              </Link>
            </div>
          </div>
          <aside className="bottle-shadow rounded-3xl border border-line bg-paper-strong p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-brass">On the bench today</p>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex justify-between border-b border-line pb-3">
                <span>Custom HRT creams</span>
                <span className="text-ink-soft">Same-week</span>
              </li>
              <li className="flex justify-between border-b border-line pb-3">
                <span>Thyroid micro-doses</span>
                <span className="text-ink-soft">48 hours</span>
              </li>
              <li className="flex justify-between">
                <span>Topical pain compounds</span>
                <span className="text-ink-soft">In stock bases</span>
              </li>
            </ul>
            <p className="mt-6 text-xs text-ink-soft">
              Demo only. No real prescriptions are filled from this site.
            </p>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <p className="text-xs uppercase tracking-[0.18em] text-brass">Therapy areas</p>
        <h2 className="serif mt-2 text-3xl">Shop by what you need compounded</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          {CATEGORIES.map((category) => (
            <Link
              key={category}
              href={`/catalog?category=${encodeURIComponent(category)}`}
              className="rounded-2xl border border-line bg-paper-strong px-4 py-5 text-sm hover:border-forest"
            >
              {category}
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-brass">Featured</p>
            <h2 className="serif text-3xl">Compounds patients refill most</h2>
          </div>
          <Link href="/catalog" className="text-sm text-leaf underline underline-offset-4">
            All products
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featuredProducts().map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-paper-strong">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 md:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.n}>
              <p className="text-xs tracking-[0.2em] text-brass">{step.n}</p>
              <h3 className="serif mt-2 text-2xl">{step.title}</h3>
              <p className="mt-2 text-sm text-ink-soft">{step.copy}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProductArt } from "@/components/ProductArt";
import { ProductCard } from "@/components/ProductCard";
import { QtyControl } from "@/components/QtyControl";
import { formatMoney } from "@/lib/format";
import { PRODUCTS } from "@/lib/products";
import { useStore } from "@/lib/store";
import type { Product } from "@/lib/types";

export function ProductDetail({ product }: { product: Product }) {
  const router = useRouter();
  const { addToCart } = useStore();
  const [doseId, setDoseId] = useState(product.doses[0]?.id ?? "");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const dose = product.doses.find((item) => item.id === doseId) ?? product.doses[0];
  const related = PRODUCTS.filter(
    (item) => item.id !== product.id && (item.category === product.category || item.tags.some((tag) => product.tags.includes(tag))),
  ).slice(0, 3);

  function add(andCheckout = false) {
    if (!dose) return;
    addToCart(product.id, dose.id, qty);
    setAdded(true);
    if (andCheckout) router.push("/cart");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <p className="text-sm text-ink-soft">
        <Link href="/catalog" className="underline underline-offset-4">
          Catalog
        </Link>{" "}
        / {product.category}
      </p>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_1fr]">
        <ProductArt product={product} className="h-80 rounded-3xl" />
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-brass">{product.form}</p>
          <h1 className="serif mt-2 text-4xl">{product.name}</h1>
          <p className="mt-3 text-ink-soft">{product.description}</p>
          {product.requiresRx ? (
            <p className="mt-4 inline-flex rounded-full bg-blush/40 px-3 py-1 text-xs">
              Prescription required in a live pharmacy
            </p>
          ) : (
            <p className="mt-4 inline-flex rounded-full bg-brass-soft/60 px-3 py-1 text-xs">
              OTC-style compound in this demo
            </p>
          )}

          <fieldset className="mt-8">
            <legend className="text-sm font-medium">Choose a dose</legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {product.doses.map((item) => {
                const selected = item.id === dose?.id;
                return (
                  <label
                    key={item.id}
                    className={`cursor-pointer rounded-2xl border px-3 py-3 text-sm ${
                      selected ? "border-forest bg-paper-strong" : "border-line"
                    }`}
                  >
                    <input
                      type="radio"
                      name="dose"
                      className="sr-only"
                      checked={selected}
                      onChange={() => setDoseId(item.id)}
                    />
                    <span className="block font-medium">{item.label}</span>
                    <span className="block text-ink-soft">{item.strength}</span>
                    <span className="mt-1 block">{formatMoney(item.price)}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <QtyControl value={qty} onChange={setQty} />
            <p className="text-lg">{dose ? formatMoney(dose.price * qty) : ""}</p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => add(false)}
              className="rounded-full bg-forest px-5 py-2.5 text-sm text-paper-strong"
            >
              Add to cart
            </button>
            <button
              type="button"
              onClick={() => add(true)}
              className="rounded-full border border-forest px-5 py-2.5 text-sm"
            >
              Add and view cart
            </button>
          </div>
          {added ? (
            <p className="mt-3 text-sm text-leaf">Added {dose?.label} to your cart.</p>
          ) : null}

          <div className="mt-8 rounded-2xl border border-line bg-paper-strong p-4 text-sm">
            <p className="font-medium">How to use</p>
            <p className="mt-1 text-ink-soft">{product.howToUse}</p>
          </div>
        </div>
      </div>

      {related.length > 0 ? (
        <section className="mt-16">
          <h2 className="serif text-3xl">Related compounds</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-3">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

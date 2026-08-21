"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/ProductCard";
import { CATEGORIES, FORMS, PRODUCTS } from "@/lib/products";
import type { Category, Form } from "@/lib/types";

export function CatalogClient() {
  const router = useRouter();
  const params = useSearchParams();
  const categoryParam = params.get("category") ?? "All";
  const category: Category | "All" = CATEGORIES.includes(categoryParam as Category)
    ? (categoryParam as Category)
    : "All";
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<Form | "All">("All");

  function setCategory(next: Category | "All") {
    const nextParams = new URLSearchParams(params.toString());
    if (next === "All") nextParams.delete("category");
    else nextParams.set("category", next);
    const suffix = nextParams.toString();
    router.replace(suffix ? `/catalog?${suffix}` : "/catalog");
  }

  const products = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PRODUCTS.filter((product) => {
      if (category !== "All" && product.category !== category) return false;
      if (form !== "All" && product.form !== form) return false;
      if (!q) return true;
      return (
        product.name.toLowerCase().includes(q) ||
        product.summary.toLowerCase().includes(q) ||
        product.tags.some((tag) => tag.includes(q))
      );
    });
  }, [query, category, form]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <p className="text-xs uppercase tracking-[0.18em] text-brass">Catalog</p>
      <h1 className="serif mt-2 text-4xl">Choose a compound and a strength</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        Fake products for this prototype. Each card opens a dose picker so you can add the exact strength to your cart.
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-[220px_1fr]">
        <aside className="space-y-5 rounded-2xl border border-line bg-paper-strong p-4">
          <label className="block text-sm">
            Search
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="estradiol, pain, thyroid…"
              className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            Therapy area
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category | "All")}
              className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2"
            >
              <option value="All">All areas</option>
              {CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Form
            <select
              value={form}
              onChange={(e) => setForm(e.target.value as Form | "All")}
              className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2"
            >
              <option value="All">All forms</option>
              {FORMS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </aside>

        <div>
          <p className="mb-4 text-sm text-ink-soft">{products.length} compounds</p>
          {products.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-line p-10 text-ink-soft">
              No compounds match those filters. Try another strength area or clear search.
            </p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

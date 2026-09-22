"use client";

import { useMemo, useState } from "react";
import { formatMoney } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Product } from "@/lib/types";

export function MedicationList({ products }: { products: Product[] }) {
  const { addToCart } = useStore();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [added, setAdded] = useState<string | null>(null);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(products.map((p) => p.category)))],
    [products],
  );

  const list = products.filter((product) => {
    if (category !== "All" && product.category !== category) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      product.name.toLowerCase().includes(q) ||
      product.summary.toLowerCase().includes(q) ||
      product.category.toLowerCase().includes(q)
    );
  });

  function doseIdFor(product: Product) {
    return selected[product.id] || product.doses[0]?.id || "";
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
      <aside className="h-fit space-y-4 rounded-xl border border-line bg-paper p-4">
        <label className="block text-sm">
          Search
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="estradiol, pain, thyroid…"
            className="mt-1 w-full rounded-lg border border-line px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          Therapy area
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 w-full rounded-lg border border-line px-3 py-2"
          >
            {categories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </aside>

      <div className="overflow-x-auto rounded-xl border border-line bg-paper">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-[#fbf9fe] text-[11px] uppercase tracking-[0.08em] text-ink-soft">
            <tr>
              <th className="px-3 py-3">Medication</th>
              <th className="px-3 py-3">Dose</th>
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {list.map((product) => {
              const selectedDose = doseIdFor(product);
              return (
                <tr key={product.id} className="border-t border-line align-top">
                  <td className="px-3 py-4">
                    <p className="font-semibold">{product.name}</p>
                    <p className="text-ink-soft">
                      {product.form} · {product.category}
                    </p>
                    <p className="text-ink-soft">{product.summary}</p>
                  </td>
                  <td className="px-3 py-4">
                    <fieldset className="flex flex-wrap gap-x-4 gap-y-2">
                      <legend className="sr-only">Dose for {product.name}</legend>
                      {product.doses.map((dose) => (
                        <label key={dose.id} className="inline-flex cursor-pointer items-center gap-2">
                          <input
                            type="radio"
                            name={`dose-${product.id}`}
                            checked={dose.id === selectedDose}
                            onChange={() =>
                              setSelected((prev) => ({ ...prev, [product.id]: dose.id }))
                            }
                          />
                          <span>
                            {dose.label} · {formatMoney(dose.price)}
                          </span>
                        </label>
                      ))}
                    </fieldset>
                  </td>
                  <td className="px-3 py-4">
                    <button
                      type="button"
                      className="rounded-lg bg-purple-deep px-3 py-1.5 text-sm font-semibold text-white"
                      onClick={() => {
                        addToCart(product.id, selectedDose, 1);
                        setAdded(product.id);
                      }}
                    >
                      {added === product.id ? "Added" : "Add"}
                    </button>
                  </td>
                </tr>
              );
            })}
            {list.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-3 py-8 text-ink-soft">
                  No medications match those filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

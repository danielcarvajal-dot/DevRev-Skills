import Link from "next/link";
import { reasonForSuggestion, suggestProducts } from "@/lib/recommendations";
import type { Order } from "@/lib/types";
import { ProductCard } from "./ProductCard";

export function Suggestions({
  orders,
  title = "Suggested for you",
}: {
  orders: Order[];
  title?: string;
}) {
  const suggestions = suggestProducts(orders, 4);
  if (suggestions.length === 0) return null;

  return (
    <section>
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-brass">Personal</p>
          <h2 className="serif text-3xl">{title}</h2>
        </div>
        <Link href="/catalog" className="text-sm text-leaf underline underline-offset-4">
          See full catalog
        </Link>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {suggestions.map((product) => (
          <div key={product.id} className="space-y-2">
            <p className="text-xs text-ink-soft">{reasonForSuggestion(product, orders)}</p>
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}

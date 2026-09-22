import Link from "next/link";
import { formatMoney } from "@/lib/format";
import type { Product } from "@/lib/types";
import { ProductArt } from "./ProductArt";

export function ProductCard({ product }: { product: Product }) {
  const from = product.doses[0]?.price ?? 0;
  return (
    <Link
      href={`/product/${product.slug}`}
      className="bottle-shadow group flex flex-col overflow-hidden rounded-2xl border border-line bg-paper-strong"
    >
      <ProductArt product={product} className="h-40" />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-xs uppercase tracking-[0.16em] text-ink-soft">{product.form}</p>
        <h3 className="serif text-xl leading-snug group-hover:text-leaf">{product.name}</h3>
        <p className="text-sm text-ink-soft">{product.summary}</p>
        <p className="mt-auto pt-3 text-sm">
          From {formatMoney(from)}
          <span className="text-ink-soft"> · {product.doses.length} strengths</span>
        </p>
      </div>
    </Link>
  );
}

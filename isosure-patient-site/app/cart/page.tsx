"use client";

import Link from "next/link";
import { QtyControl } from "@/components/QtyControl";
import { formatMoney } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function CartPage() {
  const { cart, cartTotal, products, updateQty, removeFromCart, ready } = useStore();
  const shipping = cartTotal >= 75 || cartTotal === 0 ? 0 : 8;

  if (!ready) {
    return <div className="mx-auto max-w-4xl px-4 py-16 text-ink-soft">Loading order…</div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-mid">Practice order</p>
      <h1 className="mt-2 text-3xl font-semibold">Review strengths</h1>

      {cart.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-line p-8">
          <p className="text-ink-soft">No compounds selected.</p>
          <Link href="/catalog" className="mt-4 inline-block text-sm text-purple underline underline-offset-4">
            Browse the formulary
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {cart.map((item) => {
            const product = products.find((p) => p.id === item.productId);
            const dose = product?.doses.find((d) => d.id === item.doseId);
            if (!product || !dose) return null;
            return (
              <div
                key={`${item.productId}-${item.doseId}`}
                className="flex flex-col gap-3 rounded-xl border border-line bg-paper p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold">{product.name}</p>
                  <p className="text-sm text-ink-soft">
                    {dose.label} · {product.form}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <QtyControl
                    value={item.quantity}
                    onChange={(qty) => updateQty(item.productId, item.doseId, qty)}
                  />
                  <p className="w-20 text-right">{formatMoney(dose.price * item.quantity)}</p>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.productId, item.doseId)}
                    className="text-sm text-danger underline underline-offset-4"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
          <div className="rounded-xl border border-line bg-paper p-5">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatMoney(cartTotal)}</span>
            </div>
            <div className="mt-2 flex justify-between text-sm">
              <span>Shipping</span>
              <span>{shipping === 0 ? "Waived at $75" : formatMoney(shipping)}</span>
            </div>
            <div className="mt-4 flex justify-between border-t border-line pt-4 text-lg">
              <span>Total</span>
              <span>{formatMoney(cartTotal + shipping)}</span>
            </div>
            <Link
              href="/checkout"
              className="mt-5 block rounded-lg bg-purple-deep py-3 text-center text-sm font-semibold text-white"
            >
              Continue — attach scripts
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

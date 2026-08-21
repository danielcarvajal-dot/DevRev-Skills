"use client";

import Link from "next/link";
import { QtyControl } from "@/components/QtyControl";
import { formatMoney } from "@/lib/format";
import { getDose, getProduct } from "@/lib/products";
import { useStore } from "@/lib/store";

export default function CartPage() {
  const { cart, cartTotal, updateQty, removeFromCart, ready } = useStore();
  const shipping = cartTotal >= 75 || cartTotal === 0 ? 0 : 8;

  if (!ready) {
    return <div className="mx-auto max-w-4xl px-4 py-16 text-ink-soft">Loading cart…</div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <p className="text-xs uppercase tracking-[0.18em] text-brass">Cart</p>
      <h1 className="serif mt-2 text-4xl">Review strengths before checkout</h1>

      {cart.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed border-line p-10">
          <p className="text-ink-soft">Your cart is empty. Choose a compound and a dose to get started.</p>
          <Link href="/catalog" className="mt-4 inline-block text-sm text-leaf underline underline-offset-4">
            Browse the catalog
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {cart.map((item) => {
            const product = getProduct(item.productId);
            const dose = product ? getDose(product, item.doseId) : undefined;
            if (!product || !dose) return null;
            return (
              <div
                key={`${item.productId}-${item.doseId}`}
                className="flex flex-col gap-4 rounded-2xl border border-line bg-paper-strong p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <Link href={`/product/${product.slug}`} className="serif text-xl hover:text-leaf">
                    {product.name}
                  </Link>
                  <p className="text-sm text-ink-soft">
                    {dose.label} · {product.form}
                  </p>
                  <p className="mt-1 text-sm">{formatMoney(dose.price)} each</p>
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

          <div className="rounded-2xl border border-line bg-paper-strong p-5">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatMoney(cartTotal)}</span>
            </div>
            <div className="mt-2 flex justify-between text-sm">
              <span>Shipping</span>
              <span>{shipping === 0 ? "Complimentary" : formatMoney(shipping)}</span>
            </div>
            <div className="mt-4 flex justify-between border-t border-line pt-4 text-lg">
              <span>Total</span>
              <span>{formatMoney(cartTotal + shipping)}</span>
            </div>
            <p className="mt-2 text-xs text-ink-soft">Orders of $75 or more ship at no charge in this demo.</p>
            <Link
              href="/checkout"
              className="mt-5 block rounded-full bg-forest py-3 text-center text-sm text-paper-strong"
            >
              Continue to checkout
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

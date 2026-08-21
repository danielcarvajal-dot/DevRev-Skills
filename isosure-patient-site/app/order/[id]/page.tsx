"use client";

import { use } from "react";
import Link from "next/link";
import { Suggestions } from "@/components/Suggestions";
import { formatDate, formatMoney, orderNumber } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { orders, ready } = useStore();
  const order = orders.find((item) => item.id === id);

  if (!ready) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-ink-soft">Loading order…</div>;
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="serif text-4xl">Order not found</h1>
        <p className="mt-3 text-ink-soft">This receipt is stored only in this browser profile.</p>
        <Link href="/account" className="mt-4 inline-block text-leaf underline underline-offset-4">
          Back to profile
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-xs uppercase tracking-[0.18em] text-brass">{order.status}</p>
      <h1 className="serif mt-2 text-4xl">Order {orderNumber(order.id)}</h1>
      <p className="mt-2 text-ink-soft">Placed {formatDate(order.placedAt)}</p>

      <div className="mt-8 rounded-3xl border border-line bg-paper-strong p-6">
        <ul className="space-y-3 text-sm">
          {order.items.map((item) => (
            <li key={`${item.productId}-${item.doseId}`} className="flex justify-between gap-4">
              <span>
                {item.productName}
                <span className="block text-ink-soft">
                  {item.doseLabel} × {item.quantity}
                </span>
              </span>
              <span>{formatMoney(item.unitPrice * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 space-y-1 border-t border-line pt-4 text-sm">
          <p className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatMoney(order.subtotal)}</span>
          </p>
          <p className="flex justify-between">
            <span>Shipping</span>
            <span>{order.shipping === 0 ? "Complimentary" : formatMoney(order.shipping)}</span>
          </p>
          <p className="flex justify-between text-lg">
            <span>Total</span>
            <span>{formatMoney(order.total)}</span>
          </p>
        </div>
        <p className="mt-6 text-sm text-ink-soft">
          Ship to {order.address.line1}
          {order.address.line2 ? `, ${order.address.line2}` : ""}, {order.address.city},{" "}
          {order.address.state} {order.address.zip}
        </p>
        {order.notes ? <p className="mt-2 text-sm">Pharmacist note: {order.notes}</p> : null}
      </div>

      <div className="mt-8 flex gap-4 text-sm">
        <Link href="/account" className="rounded-full bg-forest px-5 py-2.5 text-paper-strong">
          View profile and suggestions
        </Link>
        <Link href="/catalog" className="rounded-full border border-forest px-5 py-2.5">
          Keep browsing
        </Link>
      </div>

      <div className="mt-14">
        <Suggestions orders={[order]} title="Because of this order" />
      </div>
    </div>
  );
}

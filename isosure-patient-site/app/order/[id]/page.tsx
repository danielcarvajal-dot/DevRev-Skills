"use client";

import { use } from "react";
import Link from "next/link";
import { formatDate, formatMoney, orderNumber } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { orders, ready, user } = useStore();
  const order = orders.find((item) => item.id === id);
  const back = user?.role === "pharmacy" ? "/admin/orders" : "/account";

  if (!ready) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-ink-soft">Loading order…</div>;
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-semibold">Order not found</h1>
        <Link href={back} className="mt-4 inline-block text-purple underline underline-offset-4">
          Back to queue
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-mid">{order.status}</p>
      <h1 className="mt-2 text-3xl font-semibold">Order {orderNumber(order.id)}</h1>
      <p className="mt-2 text-ink-soft">
        {order.prescriberName} · {order.practiceName} · Patient {order.patientName}
      </p>
      <p className="text-sm text-ink-soft">Placed {formatDate(order.placedAt)}</p>

      <div className="mt-6 rounded-xl border border-line bg-paper p-5">
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
        <p className="mt-4 flex justify-between border-t border-line pt-4 text-lg">
          <span>Total</span>
          <span>{formatMoney(order.total)}</span>
        </p>
        <p className="mt-4 text-sm text-ink-soft">
          Ship to {order.address.line1}
          {order.address.line2 ? `, ${order.address.line2}` : ""}, {order.address.city},{" "}
          {order.address.state} {order.address.zip}
        </p>
        {order.notes ? <p className="mt-2 text-sm">Lab note: {order.notes}</p> : null}
        <h2 className="mt-5 text-lg font-semibold">Scripts</h2>
        {order.scripts.length === 0 ? (
          <p className="text-sm text-ink-soft">No files</p>
        ) : (
          <ul className="mt-2 text-sm">
            {order.scripts.map((script) => (
              <li key={script.id}>
                <a href={script.dataUrl} download={script.name} className="text-purple underline">
                  {script.name}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Link href={back} className="mt-6 inline-block rounded-lg bg-purple-deep px-4 py-2 text-sm font-semibold text-white">
        Back to queue
      </Link>
    </div>
  );
}

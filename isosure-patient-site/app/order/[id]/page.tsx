"use client";

import { use } from "react";
import Link from "next/link";
import { formatDate, formatMoney, orderNumber } from "@/lib/format";
import { DOCUMENT_KIND_LABEL, PROVIDER_STATUS_LABEL } from "@/lib/operations";
import { useStore } from "@/lib/store";

export default function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { orders, documents, ready, user } = useStore();
  const order = orders.find((item) => item.id === id);
  const back = user?.role === "pharmacy" ? "/admin/orders" : "/account";
  const relatedDocs = [
    ...(order?.scripts || []),
    ...documents.filter((doc) => doc.orderId === id && !order?.scripts.some((s) => s.id === doc.id)),
  ];

  if (!ready) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-ink-soft">Loading order…</div>;
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-semibold">Order not found</h1>
        <Link href={back} className="mt-4 inline-block text-purple underline underline-offset-4">
          Back
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-mid">
        {PROVIDER_STATUS_LABEL[order.status]}
      </p>
      <h1 className="mt-2 text-3xl font-semibold">Order {orderNumber(order.id)}</h1>
      <p className="mt-2 text-ink-soft">
        {order.prescriberName} · {order.practiceName} · Patient {order.patientName}
      </p>
      <p className="text-sm text-ink-soft">Submitted {formatDate(order.placedAt)}</p>
      <p className="mt-2 text-sm text-ink-soft">
        Status comes from Operations. This ticket does not include compounding instructions.
      </p>

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
        {order.notes ? <p className="mt-2 text-sm">Note to Operations: {order.notes}</p> : null}
        <h2 className="mt-5 text-lg font-semibold">Documents</h2>
        {relatedDocs.length === 0 ? (
          <p className="text-sm text-ink-soft">No files on this ticket.</p>
        ) : (
          <ul className="mt-2 text-sm">
            {relatedDocs.map((script) => (
              <li key={script.id}>
                {DOCUMENT_KIND_LABEL[script.kind]} ·{" "}
                {script.dataUrl ? (
                  <a href={script.dataUrl} download={script.name} className="text-purple underline">
                    {script.name}
                  </a>
                ) : (
                  script.name
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href={back} className="rounded-lg bg-purple-deep px-4 py-2 text-sm font-semibold text-white">
          Back
        </Link>
        {user?.role === "doctor" ? (
          <Link
            href={`/portal/refills?order=${order.id}`}
            className="rounded-lg border border-line px-4 py-2 text-sm"
          >
            Request refill
          </Link>
        ) : null}
      </div>
    </div>
  );
}

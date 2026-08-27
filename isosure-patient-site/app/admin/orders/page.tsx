"use client";

import Link from "next/link";
import { formatDate, formatMoney, orderNumber } from "@/lib/format";
import { CR_STAGE_LABEL } from "@/lib/lims";
import { ORDER_STATUSES, PROVIDER_STATUS_LABEL } from "@/lib/operations";
import { useStore } from "@/lib/store";
import type { OrderStatus } from "@/lib/types";

export default function AdminOrdersPage() {
  const { user, orders, crs, ready, signOut, setOrderStatus } = useStore();

  if (!ready) return <div className="mx-auto max-w-6xl px-4 py-16 text-ink-soft">Loading queue…</div>;
  if (user?.role !== "pharmacy") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-semibold">Operations sign-in required</h1>
        <Link href="/login" className="mt-4 inline-block rounded-lg bg-purple-deep px-4 py-2 text-sm font-semibold text-white">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-mid">Operations</p>
          <h1 className="mt-2 text-3xl font-semibold">Incoming provider orders</h1>
          <p className="mt-2 text-ink-soft">
            {user.contactName} · {user.pharmacyName}. Status changes notify the provider portal.
            Compounding stays in Operations.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/ops" className="rounded-lg border border-line px-4 py-2 text-sm">
            Lab pipeline
          </Link>
          <Link href="/admin/refills" className="rounded-lg border border-line px-4 py-2 text-sm">
            Refills
          </Link>
          <Link href="/admin/formulary" className="rounded-lg border border-line px-4 py-2 text-sm">
            Formulary
          </Link>
          <button type="button" onClick={signOut} className="rounded-lg border border-line px-4 py-2 text-sm">
            Sign out
          </button>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {orders.length === 0 ? <p className="text-ink-soft">No incoming orders.</p> : null}
        {orders.map((order) => (
          <article key={order.id} className="rounded-xl border border-line bg-paper p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className="rounded-full bg-purple-soft px-2 py-0.5 text-xs font-semibold text-purple">
                  {PROVIDER_STATUS_LABEL[order.status]}
                </span>
                <h2 className="mt-2 text-xl font-semibold">{orderNumber(order.id)}</h2>
                <p className="text-sm text-ink-soft">
                  {formatDate(order.placedAt)} · {order.practiceName} · Patient {order.patientName}
                </p>
              </div>
              <p className="text-lg">{formatMoney(order.total)}</p>
            </div>
            <ul className="mt-3 text-sm">
              {order.items.map((item) => (
                <li key={`${order.id}-${item.productId}-${item.doseId}`}>
                  {item.productName} · {item.doseLabel} × {item.quantity}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-sm text-ink-soft">
              {order.scripts.length} document{order.scripts.length === 1 ? "" : "s"} on the ticket
            </p>
            <ul className="mt-2 text-sm">
              {crs
                .filter((cr) => cr.orderId === order.id)
                .map((cr) => (
                  <li key={cr.id}>
                    <Link href={`/ops/batches/${cr.id}`} className="underline underline-offset-4">
                      CR {cr.batchLot} · {CR_STAGE_LABEL[cr.stage]}
                      {cr.hd ? " · HD" : ""}
                    </Link>
                  </li>
                ))}
            </ul>
            <label className="mt-3 block max-w-sm text-sm">
              Operations status (notifies provider)
              <select
                className="mt-1 w-full rounded-lg border border-line px-3 py-2"
                value={order.status}
                onChange={(e) => setOrderStatus(order.id, e.target.value as OrderStatus)}
              >
                {ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {PROVIDER_STATUS_LABEL[status]}
                  </option>
                ))}
              </select>
            </label>
            <Link href={`/order/${order.id}`} className="mt-3 inline-block text-sm underline underline-offset-4">
              Open ticket
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}

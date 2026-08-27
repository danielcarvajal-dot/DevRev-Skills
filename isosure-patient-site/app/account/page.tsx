"use client";

import Link from "next/link";
import { formatDate, formatMoney, orderNumber } from "@/lib/format";
import { PROVIDER_STATUS_LABEL } from "@/lib/operations";
import { useStore } from "@/lib/store";

export default function AccountPage() {
  const { user, orders, notifications, ready, signOut, unreadCount } = useStore();

  if (!ready) {
    return <div className="mx-auto max-w-6xl px-4 py-16 text-ink-soft">Loading provider portal…</div>;
  }

  if (!user || user.role !== "doctor") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-semibold">Provider login required</h1>
        <Link href="/login" className="mt-5 inline-block rounded-lg bg-purple-deep px-5 py-2.5 text-sm font-semibold text-white">
          Prescriber / facility login
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <section className="flex flex-col justify-between gap-4 border-b border-line pb-8 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-mid">
            Provider portal · {user.loginKind === "facility" ? "Facility" : "Prescriber"}
          </p>
          <h1 className="mt-2 text-3xl font-semibold">{user.practiceName}</h1>
          <p className="mt-2 text-ink-soft">
            {user.prescriberName} · NPI {user.npi || "—"}
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            Thin client to Operations. This view never shows compounding formulas or lab steps.
          </p>
        </div>
        <button type="button" onClick={signOut} className="w-fit rounded-lg border border-line px-4 py-2 text-sm">
          Sign out
        </button>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        <Link href="/catalog" className="rounded-xl border border-line bg-paper p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-purple-mid">Submit</p>
          <p className="mt-1 font-semibold">New order</p>
        </Link>
        <Link href="/portal/refills" className="rounded-xl border border-line bg-paper p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-purple-mid">Refills</p>
          <p className="mt-1 font-semibold">Request a refill</p>
        </Link>
        <Link href="/portal/notifications" className="rounded-xl border border-line bg-paper p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-purple-mid">Alerts</p>
          <p className="mt-1 font-semibold">{unreadCount} unread notification{unreadCount === 1 ? "" : "s"}</p>
        </Link>
      </div>

      <section>
        <h2 className="text-2xl font-semibold">Order status</h2>
        {orders.length === 0 ? (
          <p className="mt-4 text-ink-soft">No orders submitted to Operations yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {orders.map((order) => (
              <article key={order.id} className="rounded-xl border border-line bg-paper p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <span className="rounded-full bg-purple-soft px-2 py-0.5 text-xs font-semibold text-purple">
                      {PROVIDER_STATUS_LABEL[order.status] || order.status}
                    </span>
                    <h3 className="mt-2 text-xl font-semibold">{orderNumber(order.id)}</h3>
                    <p className="text-sm text-ink-soft">
                      {formatDate(order.placedAt)} · Patient {order.patientName}
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
                <div className="mt-3 flex flex-wrap gap-4 text-sm">
                  <Link href={`/order/${order.id}`} className="underline underline-offset-4">
                    Open ticket
                  </Link>
                  <Link href={`/portal/refills?order=${order.id}`} className="underline underline-offset-4">
                    Request refill
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {notifications[0] ? (
        <p className="text-sm text-ink-soft">
          Latest from Operations: {notifications[0].title}
        </p>
      ) : null}
    </div>
  );
}

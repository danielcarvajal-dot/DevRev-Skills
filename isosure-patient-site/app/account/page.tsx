"use client";

import Link from "next/link";
import { formatDate, formatMoney, orderNumber } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function AccountPage() {
  const { user, orders, ready, signOut } = useStore();

  if (!ready) {
    return <div className="mx-auto max-w-6xl px-4 py-16 text-ink-soft">Loading practice…</div>;
  }

  if (!user || user.role !== "doctor") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-semibold">Practice sign-in required</h1>
        <Link href="/login" className="mt-5 inline-block rounded-lg bg-purple-deep px-5 py-2.5 text-sm font-semibold text-white">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <section className="flex flex-col justify-between gap-4 border-b border-line pb-8 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-mid">Practice</p>
          <h1 className="mt-2 text-3xl font-semibold">{user.practiceName}</h1>
          <p className="mt-2 text-ink-soft">
            {user.prescriberName} · NPI {user.npi || "—"}
          </p>
        </div>
        <button type="button" onClick={signOut} className="w-fit rounded-lg border border-line px-4 py-2 text-sm">
          Sign out
        </button>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">Past orders</h2>
        {orders.length === 0 ? (
          <p className="mt-4 text-ink-soft">No orders yet. Attach scripts at checkout to send a fill to the lab.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {orders.map((order) => (
              <article key={order.id} className="rounded-xl border border-line bg-paper p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <span className="rounded-full bg-purple-soft px-2 py-0.5 text-xs font-semibold text-purple">
                      {order.status}
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
                <Link href={`/order/${order.id}`} className="mt-3 inline-block text-sm underline underline-offset-4">
                  Open ticket
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

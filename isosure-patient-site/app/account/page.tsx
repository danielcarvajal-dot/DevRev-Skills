"use client";

import Link from "next/link";
import { greetingName, formatDate, formatMoney, orderNumber, timeOfDayGreeting } from "@/lib/format";
import { PROVIDER_STATUS_LABEL } from "@/lib/operations";
import { formatDob, patientDisplayName } from "@/lib/patients";
import { orderableMeta } from "@/lib/orderables";
import { useStore } from "@/lib/store";

export default function AccountPage() {
  const { user, orders, drafts, patients, products, notifications, ready, signOut, unreadCount } = useStore();

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

  const greeting = `${timeOfDayGreeting()}, ${greetingName(user.prescriberName)}`;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <section className="flex flex-col justify-between gap-4 border-b border-line pb-8 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-mid">
            Provider portal · {user.loginKind === "facility" ? "Facility" : "Prescriber"}
          </p>
          <h1 className="mt-2 text-3xl font-semibold">{greeting}</h1>
          <p className="mt-2 text-ink-soft">{user.practiceName}</p>
        </div>
        <button type="button" onClick={signOut} className="w-fit rounded-lg border border-line px-4 py-2 text-sm">
          Sign out
        </button>
      </section>

      <Link
        href="/order/new"
        className="flex items-center justify-center rounded-2xl bg-purple-deep px-6 py-5 text-lg font-semibold text-white"
      >
        + New Medication Order
      </Link>

      <nav className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
        <Link href="/patients" className="underline underline-offset-4">
          Search Patients
        </Link>
        <span className="text-line">|</span>
        <a href="#recent-orders" className="underline underline-offset-4">
          Recent Orders
        </a>
        <span className="text-line">|</span>
        <a href="#drafts" className="underline underline-offset-4">
          Drafts
        </a>
        <span className="text-line">|</span>
        <Link href="/portal/notifications" className="underline underline-offset-4">
          Messages{unreadCount ? ` (${unreadCount})` : ""}
        </Link>
      </nav>

      <section id="drafts">
        <h2 className="text-2xl font-semibold">Drafts</h2>
        {drafts.length === 0 ? (
          <p className="mt-3 text-sm text-ink-soft">No saved drafts.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {drafts.map((draft) => {
              const patient = patients.find((item) => item.id === draft.patientId);
              const product = products.find((item) => item.id === draft.prescription.productId);
              return (
                <li key={draft.id} className="rounded-xl border border-line bg-paper px-4 py-3">
                  <Link href={`/order/new?draft=${draft.id}`} className="font-semibold underline-offset-4 hover:underline">
                    {patient ? patientDisplayName(patient) : "Patient not selected"}
                    {product ? ` · ${orderableMeta(product).family}` : ""}
                  </Link>
                  <p className="text-sm text-ink-soft">Updated {formatDate(draft.updatedAt)}</p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section id="recent-orders">
        <h2 className="text-2xl font-semibold">Recent orders</h2>
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
                      {order.patientDob ? ` · DOB ${formatDob(order.patientDob)}` : ""}
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
        <p className="text-sm text-ink-soft">Latest from Operations: {notifications[0].title}</p>
      ) : null}
    </div>
  );
}

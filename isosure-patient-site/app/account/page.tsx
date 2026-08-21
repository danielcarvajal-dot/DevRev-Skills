"use client";

import Link from "next/link";
import { Suggestions } from "@/components/Suggestions";
import { formatDate, formatMoney, orderNumber } from "@/lib/format";
import { getProduct } from "@/lib/products";
import { useStore } from "@/lib/store";

export default function AccountPage() {
  const { patient, orders, ready, signOut, addToCart } = useStore();

  if (!ready) {
    return <div className="mx-auto max-w-6xl px-4 py-16 text-ink-soft">Loading profile…</div>;
  }

  if (!patient) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="serif text-4xl">No profile yet</h1>
        <p className="mt-3 text-ink-soft">
          Create a patient profile to keep purchase history and get compound suggestions.
        </p>
        <Link href="/login" className="mt-5 inline-block rounded-full bg-forest px-5 py-2.5 text-sm text-paper-strong">
          Create a profile
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 py-10">
      <section className="flex flex-col justify-between gap-4 border-b border-line pb-8 md:flex-row md:items-end">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-brass">Patient profile</p>
          <h1 className="serif mt-2 text-4xl">
            {patient.firstName} {patient.lastName}
          </h1>
          <p className="mt-2 text-ink-soft">
            {patient.email}
            {patient.phone ? ` · ${patient.phone}` : ""}
          </p>
          <p className="text-sm text-ink-soft">Member since {formatDate(patient.createdAt)}</p>
        </div>
        <button
          type="button"
          onClick={signOut}
          className="w-fit rounded-full border border-line px-4 py-2 text-sm"
        >
          Sign out of this browser
        </button>
      </section>

      <Suggestions
        orders={orders}
        title={orders.length ? "Suggested next compounds" : "Popular starting compounds"}
      />

      <section>
        <h2 className="serif text-3xl">Past purchases</h2>
        {orders.length === 0 ? (
          <p className="mt-4 text-ink-soft">
            No orders yet. After checkout, every compound and dose will land here so you can refill it.
          </p>
        ) : (
          <div className="mt-5 space-y-4">
            {orders.map((order) => (
              <article key={order.id} className="rounded-2xl border border-line bg-paper-strong p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-brass">{order.status}</p>
                    <h3 className="serif text-2xl">{orderNumber(order.id)}</h3>
                    <p className="text-sm text-ink-soft">{formatDate(order.placedAt)}</p>
                  </div>
                  <p className="text-lg">{formatMoney(order.total)}</p>
                </div>
                <ul className="mt-4 space-y-2 text-sm">
                  {order.items.map((item) => {
                    const product = getProduct(item.productId);
                    return (
                      <li key={`${order.id}-${item.productId}-${item.doseId}`} className="flex flex-wrap items-center justify-between gap-3">
                        <span>
                          {item.productName} · {item.doseLabel} × {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => addToCart(item.productId, item.doseId, item.quantity)}
                          className="text-leaf underline underline-offset-4"
                        >
                          Refill this dose
                        </button>
                        {product ? (
                          <Link href={`/product/${product.slug}`} className="sr-only">
                            View {product.name}
                          </Link>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
                <Link
                  href={`/order/${order.id}`}
                  className="mt-4 inline-block text-sm underline underline-offset-4"
                >
                  View receipt
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

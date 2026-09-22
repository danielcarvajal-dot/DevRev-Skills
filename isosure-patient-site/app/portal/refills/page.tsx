"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { formatDate } from "@/lib/format";
import { useStore } from "@/lib/store";

function RefillsClient() {
  const params = useSearchParams();
  const { user, orders, refills, ready, requestRefill } = useStore();
  const [orderId, setOrderId] = useState(params.get("order") || orders[0]?.id || "");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");

  if (!ready) return <div className="text-ink-soft">Loading…</div>;
  if (!user || user.role !== "doctor") {
    return (
      <div>
        <h1 className="text-3xl font-semibold">Provider login required</h1>
        <Link href="/login" className="mt-4 inline-block text-purple underline">Sign in</Link>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-mid">Provider portal</p>
      <h1 className="mt-2 text-3xl font-semibold">Refill requests</h1>
      <p className="mt-2 text-ink-soft">
        Ask Operations to refill a prior order. The portal forwards the request; the lab decides
        whether the previous compound can be repeated.
      </p>

      <form
        className="mt-6 space-y-3 rounded-xl border border-line bg-paper p-5"
        onSubmit={(e) => {
          e.preventDefault();
          const refill = requestRefill(orderId, notes);
          setMessage(refill ? "Refill submitted to Operations." : "Choose a prior order.");
          setNotes("");
        }}
      >
        <label className="block text-sm">
          Prior order
          <select
            required
            className="mt-1 w-full rounded-lg border border-line px-3 py-2"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
          >
            <option value="">Select an order</option>
            {orders.map((order) => (
              <option key={order.id} value={order.id}>
                {order.patientName} · {order.items.map((i) => i.doseLabel).join(", ")}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Note to Operations
          <textarea
            className="mt-1 w-full rounded-lg border border-line px-3 py-2"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Continue current strength, or flag a change for the lab to review."
          />
        </label>
        <button type="submit" className="rounded-lg bg-purple-deep px-4 py-2 text-sm font-semibold text-white">
          Submit refill request
        </button>
        {message ? <p className="text-sm text-purple">{message}</p> : null}
      </form>

      <div className="mt-6 space-y-3">
        {refills.map((refill) => (
          <article key={refill.id} className="rounded-xl border border-line bg-paper p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-purple">{refill.status}</p>
            <p className="mt-1 font-semibold">{refill.patientName}</p>
            <p className="text-sm text-ink-soft">{refill.summary}</p>
            {refill.notes ? <p className="mt-1 text-sm">{refill.notes}</p> : null}
            <p className="mt-2 text-xs text-ink-soft">{formatDate(refill.requestedAt)}</p>
          </article>
        ))}
        {refills.length === 0 ? <p className="text-ink-soft">No refill requests yet.</p> : null}
      </div>
    </div>
  );
}

export default function RefillsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Suspense fallback={<p className="text-ink-soft">Loading refills…</p>}>
        <RefillsClient />
      </Suspense>
    </div>
  );
}

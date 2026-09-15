"use client";

import Link from "next/link";
import { formatDate } from "@/lib/format";
import { useStore } from "@/lib/store";

const KIND_LABEL = {
  backorder: "Backorder",
  clarification: "Clarification needed",
  ready_pickup: "Ready for pickup",
  ready_delivery: "Ready for delivery",
  order_update: "Order update",
  refill: "Refill",
};

export default function NotificationsPage() {
  const { user, notifications, ready, markNotificationRead } = useStore();

  if (!ready) return <div className="mx-auto max-w-4xl px-4 py-16 text-ink-soft">Loading…</div>;
  if (!user || user.role !== "doctor") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-semibold">Provider login required</h1>
        <Link href="/login" className="mt-4 inline-block text-purple underline">Sign in</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-mid">Provider portal</p>
      <h1 className="mt-2 text-3xl font-semibold">Notifications from Operations</h1>
      <p className="mt-2 text-ink-soft">
        Backorder, clarification needed, ready-for-pickup, and delivery alerts. The portal only displays
        what Operations sends.
      </p>
      <div className="mt-6 space-y-3">
        {notifications.length === 0 ? <p className="text-ink-soft">No notifications yet.</p> : null}
        {notifications.map((note) => (
          <article
            key={note.id}
            className={`rounded-xl border p-5 ${note.read ? "border-line bg-paper" : "border-purple-mid bg-purple-soft/40"}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-purple">
                  {KIND_LABEL[note.kind]}
                </span>
                <h2 className="mt-1 text-lg font-semibold">{note.title}</h2>
                <p className="mt-1 text-sm text-ink-soft">{note.body}</p>
                <p className="mt-2 text-xs text-ink-soft">{formatDate(note.createdAt)}</p>
              </div>
              {!note.read ? (
                <button
                  type="button"
                  className="rounded-lg border border-line bg-paper px-3 py-1.5 text-sm"
                  onClick={() => markNotificationRead(note.id)}
                >
                  Mark read
                </button>
              ) : null}
            </div>
            {note.orderId ? (
              <Link href={`/order/${note.orderId}`} className="mt-3 inline-block text-sm underline">
                Open related order
              </Link>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}

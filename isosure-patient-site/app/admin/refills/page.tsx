"use client";

import Link from "next/link";
import { formatDate } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { RefillStatus } from "@/lib/types";

const STATUSES: RefillStatus[] = ["Submitted", "Accepted", "Declined"];

export default function AdminRefillsPage() {
  const { user, refills, ready, setRefillStatus } = useStore();

  if (!ready) return <div className="mx-auto max-w-4xl px-4 py-16 text-ink-soft">Loading…</div>;
  if (user?.role !== "pharmacy") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-semibold">Operations sign-in required</h1>
        <Link href="/login" className="mt-4 inline-block text-purple underline">Sign in</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-mid">Operations</p>
      <h1 className="mt-2 text-3xl font-semibold">Refill requests</h1>
      <p className="mt-2 text-ink-soft">
        Providers submitted these as thin-client requests. Accepting a refill does not expose
        compounding steps back to the portal.
      </p>
      <div className="mt-6 space-y-3">
        {refills.length === 0 ? <p className="text-ink-soft">No refill requests.</p> : null}
        {refills.map((refill) => (
          <article key={refill.id} className="rounded-xl border border-line bg-paper p-5">
            <p className="font-semibold">{refill.patientName}</p>
            <p className="text-sm text-ink-soft">{refill.summary}</p>
            {refill.notes ? <p className="mt-1 text-sm">{refill.notes}</p> : null}
            <p className="mt-2 text-xs text-ink-soft">{formatDate(refill.requestedAt)}</p>
            <label className="mt-3 block max-w-xs text-sm">
              Decision
              <select
                className="mt-1 w-full rounded-lg border border-line px-3 py-2"
                value={refill.status}
                onChange={(e) => setRefillStatus(refill.id, e.target.value as RefillStatus)}
              >
                {STATUSES.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </label>
          </article>
        ))}
      </div>
    </div>
  );
}

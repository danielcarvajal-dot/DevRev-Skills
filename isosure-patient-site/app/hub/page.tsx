"use client";

import Link from "next/link";
import { staffName } from "@/lib/auth";
import { useStore } from "@/lib/store";

export default function PharmacistHubPage() {
  const { user, ready, signOut } = useStore();

  if (!ready) return <div className="mx-auto max-w-4xl px-4 py-16 text-ink-soft">Loading…</div>;
  if (!user || user.role !== "rph") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-semibold">Pharmacist sign-in required</h1>
        <Link href="/login" className="mt-4 inline-block rounded-lg bg-purple-deep px-4 py-2 text-sm font-semibold text-white">
          Main login
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-mid">Pharmacist · all access</p>
          <h1 className="mt-2 text-3xl font-semibold">{staffName(user)}</h1>
          <p className="mt-2 text-ink-soft">
            This account opens every ISOSure surface: Operations, Provider, and Quality.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            signOut();
            window.location.href = "/login";
          }}
          className="rounded-lg border border-line px-4 py-2 text-sm"
        >
          Sign out
        </button>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Link href="/ops" className="rounded-xl border border-line bg-paper p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-purple-mid">Operations</p>
          <h2 className="mt-2 text-lg font-semibold">Lab floor</h2>
          <p className="mt-2 text-sm text-ink-soft">Compounding records, inventory, MFRs, intake.</p>
        </Link>
        <Link href="/account" className="rounded-xl border border-line bg-paper p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-purple-mid">Provider</p>
          <h2 className="mt-2 text-lg font-semibold">Provider portal</h2>
          <p className="mt-2 text-sm text-ink-soft">Patients, medication orders, status, refills.</p>
        </Link>
        <Link href="/qa" className="rounded-xl border border-line bg-paper p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-purple-mid">Quality</p>
          <h2 className="mt-2 text-lg font-semibold">QMS</h2>
          <p className="mt-2 text-sm text-ink-soft">Release review, deviations, environment holds.</p>
        </Link>
      </div>
    </div>
  );
}

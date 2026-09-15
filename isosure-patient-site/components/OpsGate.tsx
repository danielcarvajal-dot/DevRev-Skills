"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";

export function OpsGate({ children }: { children: React.ReactNode }) {
  const { user, ready } = useStore();
  if (!ready) return <div className="mx-auto max-w-6xl px-4 py-16 text-ink-soft">Loading Operations…</div>;
  if (user?.role !== "pharmacy") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-mid">Operations</p>
        <h1 className="mt-2 text-3xl font-semibold">Lab sign-in required</h1>
        <p className="mt-2 text-ink-soft">
          The LIMS/MOM core is internal. Provider portal users cannot open compounding records.
        </p>
        <Link href="/login" className="mt-4 inline-block rounded-lg bg-purple-deep px-4 py-2 text-sm font-semibold text-white">
          Operations login
        </Link>
      </div>
    );
  }
  return <>{children}</>;
}

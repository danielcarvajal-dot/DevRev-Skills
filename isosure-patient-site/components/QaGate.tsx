"use client";

import Link from "next/link";
import { canAccessQa } from "@/lib/auth";
import { useStore } from "@/lib/store";

export function QaGate({ children }: { children: React.ReactNode }) {
  const { user, ready } = useStore();
  if (!ready) return <div className="mx-auto max-w-6xl px-4 py-16 text-ink-soft">Loading Quality…</div>;
  if (!canAccessQa(user)) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-mid">Quality</p>
        <h1 className="mt-2 text-3xl font-semibold">Quality sign-in required</h1>
        <p className="mt-2 text-ink-soft">Use hkitner-QA or the pharmacist account (hkitner-RPh).</p>
        <Link href="/login" className="mt-4 inline-block rounded-lg bg-purple-deep px-4 py-2 text-sm font-semibold text-white">
          Main login
        </Link>
      </div>
    );
  }
  return <>{children}</>;
}

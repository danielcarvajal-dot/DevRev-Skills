"use client";

import Link from "next/link";
import { canAccessProvider } from "@/lib/auth";
import { useStore } from "@/lib/store";

export function ProviderGate({ children }: { children: React.ReactNode }) {
  const { user, ready } = useStore();
  if (!ready) return <div className="mx-auto max-w-6xl px-4 py-16 text-ink-soft">Loading provider portal…</div>;
  if (!canAccessProvider(user)) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-semibold">Provider login required</h1>
        <p className="mt-2 text-ink-soft">Use hkitner-Provider or the pharmacist account (hkitner-RPh).</p>
        <Link href="/login" className="mt-5 inline-block rounded-lg bg-purple-deep px-5 py-2.5 text-sm font-semibold text-white">
          Main login
        </Link>
      </div>
    );
  }
  return <>{children}</>;
}

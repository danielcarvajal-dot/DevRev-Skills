"use client";

import Link from "next/link";
import { canAccessProvider } from "@/lib/auth";
import { isCompleteProviderProfile } from "@/lib/provider-profile";
import { useStore } from "@/lib/store";

export function ProviderGate({ children }: { children: React.ReactNode }) {
  const { user, ready } = useStore();
  if (!ready) return <div className="mx-auto max-w-6xl px-4 py-16 text-ink-soft">Loading provider portal…</div>;
  if (!canAccessProvider(user)) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-semibold">Provider login required</h1>
        <p className="mt-2 text-ink-soft">Use hkitner-Provider, create a provider profile, or sign in as hkitner-RPh.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/login" className="inline-block rounded-lg bg-purple-deep px-5 py-2.5 text-sm font-semibold text-white">
            Main login
          </Link>
          <Link href="/provider/register" className="inline-block rounded-lg border border-line px-5 py-2.5 text-sm">
            Create provider profile
          </Link>
        </div>
      </div>
    );
  }
  if (user?.role === "doctor" && !isCompleteProviderProfile(user)) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-semibold">Complete your provider profile</h1>
        <p className="mt-2 text-ink-soft">
          Name, practice name, address, phone, NPI, state license, DEA, and a clinic card on file
          are required. Clinic and patient price will be different.
        </p>
        <Link href="/provider/register" className="mt-5 inline-block rounded-lg bg-purple-deep px-5 py-2.5 text-sm font-semibold text-white">
          Complete profile
        </Link>
      </div>
    );
  }
  return <>{children}</>;
}

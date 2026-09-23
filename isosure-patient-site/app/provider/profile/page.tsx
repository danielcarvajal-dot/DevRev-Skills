"use client";

import Link from "next/link";
import { ProviderProfileForm } from "@/components/ProviderProfileForm";
import { formatAddress, formatClinicCard } from "@/lib/provider-profile";
import { useStore } from "@/lib/store";

export default function ProviderProfilePage() {
  const { user, ready } = useStore();

  if (!ready) {
    return <div className="mx-auto max-w-xl px-4 py-16 text-ink-soft">Loading profile…</div>;
  }

  if (!user || user.role !== "doctor") {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <h1 className="text-3xl font-semibold">Create a provider profile</h1>
        <p className="mt-2 text-ink-soft">
          Provider accounts need a complete practice profile before ordering.
        </p>
        <Link
          href="/provider/register"
          className="mt-5 inline-block rounded-lg bg-purple-deep px-5 py-2.5 text-sm font-semibold text-white"
        >
          Create provider profile
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-mid">Provider portal</p>
      <h1 className="mt-2 text-3xl font-semibold">Provider profile</h1>
      <p className="mt-2 text-ink-soft">
        {formatAddress(user.address)} · {formatClinicCard(user.clinicCard)}
      </p>
      <p className="mt-1 text-sm text-ink-soft">Clinic and patient price will be different.</p>
      <div className="mt-8">
        <ProviderProfileForm existing={user} />
      </div>
    </div>
  );
}

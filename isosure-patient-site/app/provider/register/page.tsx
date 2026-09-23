"use client";

import Link from "next/link";
import { ProviderProfileForm } from "@/components/ProviderProfileForm";
import { useStore } from "@/lib/store";

export default function ProviderRegisterPage() {
  const { user } = useStore();
  const existing = user?.role === "doctor" ? user : null;

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-mid">Provider portal</p>
      <h1 className="mt-2 text-3xl font-semibold">
        {existing ? "Edit provider profile" : "Create provider profile"}
      </h1>
      <p className="mt-2 text-ink-soft">
        Name, practice, address, phone, NPI, state license, DEA, and a clinic card on file are
        required. Clinic and patient price will be different.
      </p>
      <div className="mt-8">
        <ProviderProfileForm existing={existing} />
      </div>
      <p className="mt-6 text-center text-sm text-ink-soft">
        Already have a demo login?{" "}
        <Link href="/login" className="underline underline-offset-4">
          Main login
        </Link>
      </p>
    </div>
  );
}

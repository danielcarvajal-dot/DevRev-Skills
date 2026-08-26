"use client";

import Link from "next/link";
import { MedicationList } from "@/components/MedicationList";
import { useStore } from "@/lib/store";

export default function CatalogPage() {
  const { products, user, ready } = useStore();

  if (!ready) {
    return <div className="mx-auto max-w-6xl px-4 py-16 text-ink-soft">Loading formulary…</div>;
  }

  if (user?.role === "pharmacy") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-semibold">Pharmacy staff manage the list here</h1>
        <Link href="/admin/formulary" className="mt-4 inline-block rounded-lg bg-purple-deep px-4 py-2 text-sm font-semibold text-white">
          Open formulary admin
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-mid">Formulary</p>
      <h1 className="mt-2 text-3xl font-semibold">Select compounds and strengths</h1>
      <p className="mt-2 max-w-2xl text-ink-soft">
        Each row is one medication. Choose the dose with the radio buttons, then add it to the practice order.
      </p>
      <div className="mt-6">
        <MedicationList products={products} />
      </div>
    </div>
  );
}

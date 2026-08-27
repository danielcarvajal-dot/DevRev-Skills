"use client";

import Link from "next/link";
import { OpsGate } from "@/components/OpsGate";
import { useStore } from "@/lib/store";

export default function MfrListPage() {
  const { mfrs } = useStore();
  return (
    <OpsGate>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-mid">USP &lt;795&gt; / &lt;797&gt;</p>
        <h1 className="mt-2 text-3xl font-semibold">Master Formulation Records</h1>
        <p className="mt-2 max-w-2xl text-ink-soft">
          Recipe source of truth. Each MFR drives BUD defaults, HD precautions, and the compounding
          record created when a portal order is received.
        </p>
        <div className="mt-6 space-y-3">
          {mfrs.map((mfr) => (
            <Link key={mfr.id} href={`/ops/mfr/${mfr.id}`} className="block rounded-xl border border-line bg-paper p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-purple-mid">
                USP &lt;{mfr.uspChapter}&gt; · {mfr.vehicle}
                {mfr.hdPrecautions ? " · HD" : ""}
              </p>
              <h2 className="mt-1 text-lg font-semibold">{mfr.title}</h2>
              <p className="text-sm text-ink-soft">
                {mfr.strength} · batch {mfr.batchSize} {mfr.batchUnit} · {mfr.container}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </OpsGate>
  );
}

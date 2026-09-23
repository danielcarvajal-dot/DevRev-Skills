"use client";

import Link from "next/link";
import { QaGate } from "@/components/QaGate";
import { formatDate } from "@/lib/format";
import { lotAlerts } from "@/lib/lims";
import { useStore } from "@/lib/store";

export default function QualityPage() {
  const { user, crs, lots, envLogs, signOut } = useStore();
  const alerts = lotAlerts(lots);
  const quarantined = alerts.filter((row) => row.lot.quarantine || row.expired);
  const envOut = envLogs.filter((log) => !log.inSpec);
  const release = crs.filter((cr) => cr.stage === "labeling" || cr.stage === "dispense");
  const hdOpen = crs.filter((cr) => cr.hd && cr.stage !== "shipped");

  return (
    <QaGate>
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-mid">Quality · QMS</p>
            <h1 className="mt-2 text-3xl font-semibold">Quality</h1>
            <p className="mt-2 max-w-2xl text-ink-soft">
              Release review, deviations, and environment holds. Compounding stays on the Operations
              floor. Quality does not write MFRs or weigh lots.
            </p>
          </div>
          <button type="button" onClick={signOut} className="rounded-lg border border-line px-4 py-2 text-sm">
            Sign out
          </button>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <article className="rounded-xl border border-line bg-paper p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-purple-mid">Release</p>
            <p className="mt-1 text-2xl font-semibold">{release.length}</p>
            <p className="text-sm text-ink-soft">Batches at label / dispense</p>
          </article>
          <article className="rounded-xl border border-line bg-paper p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-danger">Holds</p>
            <p className="mt-1 text-2xl font-semibold">{quarantined.length}</p>
            <p className="text-sm text-ink-soft">Quarantine or expired lots</p>
          </article>
          <article className="rounded-xl border border-line bg-paper p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-purple-mid">Environment</p>
            <p className="mt-1 text-2xl font-semibold">{envOut.length}</p>
            <p className="text-sm text-ink-soft">Out-of-spec readings</p>
          </article>
        </div>

        <h2 className="mt-10 text-xl font-semibold">Release queue</h2>
        <div className="mt-3 space-y-2">
          {release.length === 0 ? <p className="text-ink-soft">No batches waiting on Quality release.</p> : null}
          {release.map((cr) => (
            <article key={cr.id} className="rounded-xl border border-line bg-paper px-4 py-3">
              <p className="font-semibold">
                {cr.productName} · {cr.doseLabel}
              </p>
              <p className="text-sm text-ink-soft">
                {cr.patientName} · {cr.batchLot} · {cr.stage}
                {cr.hd ? " · HD" : ""}
              </p>
              {user?.role === "rph" ? (
                <Link href={`/ops/batches/${cr.id}`} className="mt-1 inline-block text-sm underline">
                  Open compounding record
                </Link>
              ) : null}
            </article>
          ))}
        </div>

        <h2 className="mt-10 text-xl font-semibold">Deviations · environment</h2>
        <div className="mt-3 space-y-2">
          {envOut.length === 0 ? <p className="text-ink-soft">No open environment deviations.</p> : null}
          {envOut.map((log) => (
            <article key={log.id} className="rounded-xl border border-line bg-paper px-4 py-3 text-sm">
              <p className="font-semibold">{log.area} · {log.isoClass}</p>
              <p className="text-ink-soft">
                {log.temperatureC} °C · {log.humidityPct}% RH · {formatDate(log.recordedAt)} · {log.recordedBy}
              </p>
            </article>
          ))}
        </div>

        <h2 className="mt-10 text-xl font-semibold">Material holds</h2>
        <div className="mt-3 space-y-2">
          {quarantined.map((row) => (
            <article key={row.lot.id} className="rounded-xl border border-line bg-paper px-4 py-3 text-sm">
              <p className="font-semibold">{row.lot.lotNumber}</p>
              <p className="text-ink-soft">
                {row.lot.quarantine ? "Quarantine" : "Expired"} · {row.lot.manufacturer || row.lot.supplier} · CAS{" "}
                {row.lot.cas || "—"}
              </p>
            </article>
          ))}
        </div>

        <p className="mt-8 text-sm text-ink-soft">{hdOpen.length} open HD batches are visible to Quality for USP &lt;800&gt; review.</p>
      </div>
    </QaGate>
  );
}

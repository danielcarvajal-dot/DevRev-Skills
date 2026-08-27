"use client";

import Link from "next/link";
import { OpsGate } from "@/components/OpsGate";
import { formatDate, orderNumber } from "@/lib/format";
import { CR_STAGE_LABEL, CR_STAGES, lotAlerts } from "@/lib/lims";
import { getIngredient } from "@/lib/lims-catalog";
import { useStore } from "@/lib/store";

export default function OperationsDashboard() {
  const { crs, lots, ingredients, envLogs, orders, user } = useStore();
  const alerts = lotAlerts(lots);
  const expired = alerts.filter((a) => a.expired).length;
  const soon = alerts.filter((a) => a.expiringSoon).length;
  const hdOpen = crs.filter((cr) => cr.hd && cr.stage !== "shipped").length;
  const envOut = envLogs.filter((log) => !log.inSpec).length;

  return (
    <OpsGate>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-mid">
          Operations · LIMS / MOM
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Electric Lab</h1>
        <p className="mt-2 max-w-2xl text-ink-soft">
          Orders arrive from the provider portal. This system owns formula/recipe (MFR), compounding
          records (CR), BUD, lot traceability, USP &lt;800&gt; HD flags, inventory, and environment logs.
          {user?.role === "pharmacy" ? ` Signed in as ${user.contactName}.` : ""}
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/admin/orders" className="rounded-xl border border-line bg-paper p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-purple-mid">Intake</p>
            <p className="mt-1 text-2xl font-semibold">{orders.length}</p>
            <p className="text-sm text-ink-soft">Provider orders in queue</p>
          </Link>
          <Link href="/ops/inventory" className="rounded-xl border border-line bg-paper p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-purple-mid">Inventory</p>
            <p className="mt-1 text-2xl font-semibold">{expired + soon}</p>
            <p className="text-sm text-ink-soft">{expired} expired · {soon} expiring &lt; 30d</p>
          </Link>
          <Link href="/ops/ingredients" className="rounded-xl border border-line bg-paper p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-danger">USP &lt;800&gt;</p>
            <p className="mt-1 text-2xl font-semibold">{hdOpen}</p>
            <p className="text-sm text-ink-soft">Open HD batches</p>
          </Link>
          <Link href="/ops/environment" className="rounded-xl border border-line bg-paper p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-purple-mid">Environment</p>
            <p className="mt-1 text-2xl font-semibold">{envOut}</p>
            <p className="text-sm text-ink-soft">Out-of-spec readings</p>
          </Link>
        </div>

        <h2 className="mt-10 text-xl font-semibold">Production pipeline</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Intake → formula/recipe → batch production → labeling → dispensing/shipping
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3 lg:grid-cols-6">
          {CR_STAGES.map((stage) => {
            const rows = crs.filter((cr) => cr.stage === stage);
            return (
              <section key={stage} className="rounded-xl border border-line bg-paper p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-purple-mid">
                  {CR_STAGE_LABEL[stage]}
                </p>
                <p className="mt-1 text-xl font-semibold">{rows.length}</p>
                <ul className="mt-2 space-y-2 text-sm">
                  {rows.slice(0, 4).map((cr) => (
                    <li key={cr.id}>
                      <Link href={`/ops/batches/${cr.id}`} className="underline underline-offset-2">
                        {cr.patientName.split(" ")[0]} · {cr.doseLabel}
                      </Link>
                      {cr.hd ? <span className="ml-1 text-[11px] font-semibold text-danger">HD</span> : null}
                    </li>
                  ))}
                  {rows.length === 0 ? <li className="text-ink-soft">Empty</li> : null}
                </ul>
              </section>
            );
          })}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <section>
            <h2 className="text-xl font-semibold">Open compounding records</h2>
            <div className="mt-3 space-y-2">
              {crs.filter((cr) => cr.stage !== "shipped").map((cr) => (
                <Link
                  key={cr.id}
                  href={`/ops/batches/${cr.id}`}
                  className="block rounded-xl border border-line bg-paper p-4"
                >
                  <div className="flex flex-wrap justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-purple-mid">
                        {CR_STAGE_LABEL[cr.stage]}
                        {cr.hd ? " · USP <800> HD" : ""}
                      </p>
                      <p className="mt-1 font-semibold">
                        {cr.productName} · {cr.doseLabel}
                      </p>
                      <p className="text-sm text-ink-soft">
                        {cr.patientName} · {orderNumber(cr.orderId)} · {cr.batchLot}
                      </p>
                    </div>
                    <p className="text-sm text-ink-soft">{formatDate(cr.createdAt)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
          <section>
            <h2 className="text-xl font-semibold">Lot exceptions</h2>
            <div className="mt-3 overflow-x-auto rounded-xl border border-line bg-paper">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead className="bg-[#fbf9fe] text-[11px] uppercase tracking-[0.08em] text-ink-soft">
                  <tr>
                    <th className="px-3 py-2">Lot</th>
                    <th className="px-3 py-2">Ingredient</th>
                    <th className="px-3 py-2">Expires</th>
                    <th className="px-3 py-2">Flag</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts
                    .filter((a) => a.expired || a.expiringSoon || a.lot.quarantine)
                    .map(({ lot, expired, expiringSoon }) => (
                      <tr key={lot.id} className="border-t border-line">
                        <td className="px-3 py-2">{lot.lotNumber}</td>
                        <td className="px-3 py-2">{getIngredient(lot.ingredientId, ingredients)?.name}</td>
                        <td className="px-3 py-2">{formatDate(lot.expiresAt)}</td>
                        <td className="px-3 py-2 text-danger">
                          {lot.quarantine ? "Quarantine" : expired ? "Expired" : expiringSoon ? "Expiring" : ""}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </OpsGate>
  );
}

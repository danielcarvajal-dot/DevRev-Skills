"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { OpsGate } from "@/components/OpsGate";
import { formatDate, orderNumber } from "@/lib/format";
import { CR_STAGE_LABEL } from "@/lib/lims";
import { lotAlerts } from "@/lib/lims";
import {
  LAB_TECHS,
  filterFloor,
  groupByApi,
  kpiPoints,
  priorityLabel,
  reorderAlerts,
  type FloorFilter,
} from "@/lib/ops-floor";
import { useStore } from "@/lib/store";
import type { CrPriority } from "@/lib/lims-types";

const FILTERS: { id: FloorFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "priority", label: "Priority" },
  { id: "hd", label: "HD" },
  { id: "sterile", label: "Sterile" },
  { id: "nonsterile", label: "Nonsterile" },
];

export default function OperationsDashboard() {
  const { crs, lots, ingredients, mfrs, envLogs, orders, user, updateCompound, moveCompound } = useStore();
  const [filter, setFilter] = useState<FloorFilter>("all");
  const alerts = lotAlerts(lots);
  const expired = alerts.filter((a) => a.expired).length;
  const soon = alerts.filter((a) => a.expiringSoon).length;
  const hdOpen = crs.filter((cr) => cr.hd && cr.stage !== "shipped").length;
  const envOut = envLogs.filter((log) => !log.inSpec).length;
  const low = reorderAlerts(ingredients, lots);

  const floor = useMemo(() => filterFloor(crs, mfrs, filter), [crs, filter, mfrs]);
  const groups = useMemo(() => groupByApi(floor, mfrs, ingredients), [floor, ingredients, mfrs]);
  const daily = LAB_TECHS.map((tech) => {
    const assigned = floor.filter((cr) => cr.assignedTech === tech);
    const points = assigned.reduce((sum, cr) => {
      const mfr = mfrs.find((item) => item.id === cr.mfrId);
      return sum + kpiPoints(cr, mfr);
    }, 0);
    return { tech, assigned, points };
  });
  const unassigned = floor.filter((cr) => !cr.assignedTech);

  return (
    <OpsGate>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-mid">
          Operations · LIMS / MOM
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Lab floor</h1>
        <p className="mt-2 max-w-2xl text-ink-soft">
          Every compound lands here from the provider portal. Filter by priority, HD, sterile, or
          nonsterile. Group similar APIs into a daily list and assign a tech. Points track KPI load.
          {user?.role === "pharmacy" ? ` Signed in as ${user.contactName}.` : ""}
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/admin/orders" className="rounded-xl border border-line bg-paper p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-purple-mid">Intake</p>
            <p className="mt-1 text-2xl font-semibold">{orders.length}</p>
            <p className="text-sm text-ink-soft">Provider orders — qty auto-rounds</p>
          </Link>
          <Link href="/ops/inventory" className="rounded-xl border border-line bg-paper p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-purple-mid">Inventory</p>
            <p className="mt-1 text-2xl font-semibold">{low.length}</p>
            <p className="text-sm text-ink-soft">
              Below reorder · {expired} expired · {soon} &lt;30d
            </p>
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

        <div className="mt-8 flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`rounded-full px-3 py-1 text-sm ${
                filter === item.id ? "bg-purple-deep text-white" : "border border-line bg-paper"
              }`}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <h2 className="mt-8 text-xl font-semibold">Grouped by API</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Similar APIs sit together so you can build a complete daily list and assign it per tech.
          Move rows to change the board order.
        </p>
        <div className="mt-4 space-y-4">
          {groups.length === 0 ? <p className="text-ink-soft">No open compounds for this filter.</p> : null}
          {groups.map((group) => (
            <section key={group.apiId} className="rounded-xl border border-line bg-paper p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-purple-mid">
                    {group.compounds.length} compound{group.compounds.length === 1 ? "" : "s"}
                    {group.cas ? ` · CAS ${group.cas}` : ""}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold">{group.apiName}</h3>
                </div>
                <p className="rounded-full bg-purple-soft px-2 py-0.5 text-xs font-semibold text-purple">
                  {group.points} KPI pts
                </p>
              </div>
              <div className="mt-3 space-y-2">
                {group.compounds.map((cr) => {
                  const mfr = mfrs.find((item) => item.id === cr.mfrId);
                  return (
                    <article key={cr.id} className="rounded-lg border border-line px-3 py-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-purple-mid">
                            {priorityLabel(cr.priority)} · {CR_STAGE_LABEL[cr.stage]}
                            {cr.hd ? " · HD" : ""}
                            {mfr?.uspChapter === "797" ? " · Sterile" : " · Nonsterile"}
                          </p>
                          <Link href={`/ops/batches/${cr.id}`} className="mt-1 block font-semibold underline-offset-2 hover:underline">
                            {cr.productName} · {cr.doseLabel}
                          </Link>
                          <p className="text-sm text-ink-soft">
                            {cr.patientName} · {orderNumber(cr.orderId)} · ordered {cr.orderedQty} → compound{" "}
                            {cr.compoundQty}
                            {cr.qtyManuallyAdjusted ? " (adjusted)" : cr.compoundQty !== cr.orderedQty ? " (auto-round)" : ""}
                          </p>
                        </div>
                        <p className="text-sm text-ink-soft">{kpiPoints(cr, mfr)} pts</p>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                        <label className="inline-flex items-center gap-1">
                          Priority
                          <select
                            className="rounded-lg border border-line px-2 py-1"
                            value={cr.priority}
                            onChange={(e) => updateCompound(cr.id, { priority: e.target.value as CrPriority })}
                          >
                            <option value="stat">STAT</option>
                            <option value="today">Today</option>
                            <option value="routine">Routine</option>
                          </select>
                        </label>
                        <label className="inline-flex items-center gap-1">
                          Tech
                          <select
                            className="rounded-lg border border-line px-2 py-1"
                            value={cr.assignedTech}
                            onChange={(e) => updateCompound(cr.id, { assignedTech: e.target.value })}
                          >
                            <option value="">Unassigned</option>
                            {LAB_TECHS.map((tech) => (
                              <option key={tech} value={tech}>
                                {tech}
                              </option>
                            ))}
                          </select>
                        </label>
                        <button type="button" className="rounded-lg border border-line px-2 py-1" onClick={() => moveCompound(cr.id, -1)}>
                          Up
                        </button>
                        <button type="button" className="rounded-lg border border-line px-2 py-1" onClick={() => moveCompound(cr.id, 1)}>
                          Down
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <h2 className="mt-10 text-xl font-semibold">Daily list by tech</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Point totals are the KPI load for today. Reassign from the API groups above.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {daily.map((row) => (
            <section key={row.tech} className="rounded-xl border border-line bg-paper p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-purple-mid">{row.points} KPI pts</p>
              <h3 className="mt-1 font-semibold">{row.tech}</h3>
              <ul className="mt-2 space-y-1 text-sm">
                {row.assigned.map((cr) => (
                  <li key={cr.id}>
                    <Link href={`/ops/batches/${cr.id}`} className="underline underline-offset-2">
                      {cr.patientName.split(" ")[0]} · {cr.doseLabel}
                    </Link>
                    {cr.hd ? <span className="ml-1 text-[11px] font-semibold text-danger">HD</span> : null}
                  </li>
                ))}
                {row.assigned.length === 0 ? <li className="text-ink-soft">No compounds assigned</li> : null}
              </ul>
            </section>
          ))}
        </div>
        {unassigned.length ? (
          <p className="mt-3 text-sm text-ink-soft">{unassigned.length} unassigned compound{unassigned.length === 1 ? "" : "s"}.</p>
        ) : null}

        {low.length ? (
          <section className="mt-10">
            <h2 className="text-xl font-semibold">Below reorder point</h2>
            <ul className="mt-3 space-y-2">
              {low.map((row) => (
                <li key={row.ingredient.id} className="rounded-xl border border-line bg-paper px-4 py-3 text-sm">
                  <span className="font-semibold">{row.ingredient.name}</span>
                  <span className="text-ink-soft">
                    {" "}
                    · on hand {row.remaining} {row.ingredient.unit} · reorder at {row.point}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <p className="mt-8 text-sm text-ink-soft">Pipeline stages still live on each compounding record. Open a row to advance intake → formula → batch → label → ship.</p>
        <p className="mt-2 text-xs text-ink-soft">{formatDate(new Date().toISOString())} floor</p>
      </div>
    </OpsGate>
  );
}

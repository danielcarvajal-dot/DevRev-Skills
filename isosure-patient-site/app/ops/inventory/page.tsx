"use client";

import { useState } from "react";
import { OpsGate } from "@/components/OpsGate";
import { formatDate } from "@/lib/format";
import { lotAlerts } from "@/lib/lims";
import { getIngredient } from "@/lib/lims-catalog";
import { useStore } from "@/lib/store";

export default function InventoryPage() {
  const { lots, ingredients, csLogs, receiveLot } = useStore();
  const [ingredientId, setIngredientId] = useState(ingredients[0]?.id || "");
  const [lotNumber, setLotNumber] = useState("");
  const [qty, setQty] = useState("25");
  const [expires, setExpires] = useState("");
  const [coa, setCoa] = useState("");
  const [potency, setPotency] = useState("99.5");
  const alerts = lotAlerts(lots);

  return (
    <OpsGate>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-mid">Operations inventory</p>
        <h1 className="mt-2 text-3xl font-semibold">Lots, COAs, expiration, controlled substances</h1>
        <p className="mt-2 max-w-2xl text-ink-soft">
          FEFO selection during compounding. Expired and quarantined lots cannot be used. Schedule
          III–V issues write a perpetual log.
        </p>

        <form
          className="mt-6 grid gap-3 rounded-xl border border-line bg-paper p-5 md:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault();
            const ing = getIngredient(ingredientId, ingredients);
            if (!ing || !lotNumber || !expires) return;
            receiveLot({
              ingredientId,
              lotNumber,
              supplier: "Receiving",
              receivedAt: new Date().toISOString(),
              expiresAt: new Date(expires).toISOString(),
              quantity: Number(qty) || 0,
              unit: ing.unit,
              potencyPct: Number(potency) || 100,
              coaName: coa || `COA-${lotNumber}.pdf`,
              quarantine: false,
            });
            setLotNumber("");
            setCoa("");
          }}
        >
          <label className="text-sm">
            Ingredient
            <select className="mt-1 w-full rounded-lg border border-line px-3 py-2" value={ingredientId} onChange={(e) => setIngredientId(e.target.value)}>
              {ingredients.map((ing) => (
                <option key={ing.id} value={ing.id}>{ing.name}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Lot number
            <input className="mt-1 w-full rounded-lg border border-line px-3 py-2" value={lotNumber} onChange={(e) => setLotNumber(e.target.value)} required />
          </label>
          <label className="text-sm">
            Quantity
            <input className="mt-1 w-full rounded-lg border border-line px-3 py-2" value={qty} onChange={(e) => setQty(e.target.value)} />
          </label>
          <label className="text-sm">
            Expiration
            <input type="date" className="mt-1 w-full rounded-lg border border-line px-3 py-2" value={expires} onChange={(e) => setExpires(e.target.value)} required />
          </label>
          <label className="text-sm">
            Potency %
            <input className="mt-1 w-full rounded-lg border border-line px-3 py-2" value={potency} onChange={(e) => setPotency(e.target.value)} />
          </label>
          <label className="text-sm">
            COA file name
            <input className="mt-1 w-full rounded-lg border border-line px-3 py-2" value={coa} onChange={(e) => setCoa(e.target.value)} placeholder="COA-lot.pdf" />
          </label>
          <button type="submit" className="rounded-lg bg-purple-deep px-4 py-2 text-sm font-semibold text-white md:col-span-3">
            Receive lot
          </button>
        </form>

        <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-paper">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-[#fbf9fe] text-[11px] uppercase tracking-[0.08em] text-ink-soft">
              <tr>
                <th className="px-3 py-2">Lot</th>
                <th className="px-3 py-2">Ingredient</th>
                <th className="px-3 py-2">Remaining</th>
                <th className="px-3 py-2">Assay</th>
                <th className="px-3 py-2">Expires</th>
                <th className="px-3 py-2">COA</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map(({ lot, expired, expiringSoon }) => {
                const ing = getIngredient(lot.ingredientId, ingredients);
                return (
                  <tr key={lot.id} className="border-t border-line">
                    <td className="px-3 py-2">{lot.lotNumber}</td>
                    <td className="px-3 py-2">
                      {ing?.name}
                      {ing?.nioshTable ? <span className="ml-1 text-danger">NIOSH T{ing.nioshTable}</span> : null}
                      {ing?.controlledSchedule ? <span className="ml-1">C-{ing.controlledSchedule}</span> : null}
                    </td>
                    <td className="px-3 py-2">
                      {lot.remaining} / {lot.quantity} {lot.unit}
                    </td>
                    <td className="px-3 py-2">{lot.potencyPct}%</td>
                    <td className="px-3 py-2">{formatDate(lot.expiresAt)}</td>
                    <td className="px-3 py-2">{lot.coaName}</td>
                    <td className={`px-3 py-2 ${expired || lot.quarantine ? "text-danger" : expiringSoon ? "text-purple" : "text-ok"}`}>
                      {lot.quarantine ? "Quarantine" : expired ? "Expired" : expiringSoon ? "Expiring" : "Released"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <h2 className="mt-10 text-xl font-semibold">Controlled substance perpetual log</h2>
        <div className="mt-3 space-y-2">
          {csLogs.length === 0 ? <p className="text-ink-soft">No CS issues yet.</p> : null}
          {csLogs.map((log) => (
            <article key={log.id} className="rounded-xl border border-line bg-paper p-4 text-sm">
              <p className="font-semibold">
                {getIngredient(log.ingredientId, ingredients)?.name} · {log.quantity} {log.unit} issued
              </p>
              <p className="text-ink-soft">
                {formatDate(log.at)} · CR {log.crId.slice(-6).toUpperCase()} · remaining {log.remaining} {log.unit} · {log.pharmacist}
              </p>
            </article>
          ))}
        </div>
      </div>
    </OpsGate>
  );
}

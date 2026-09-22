"use client";

import { useState } from "react";
import { OpsGate } from "@/components/OpsGate";
import { formatDate } from "@/lib/format";
import { lotAlerts } from "@/lib/lims";
import { getIngredient } from "@/lib/lims-catalog";
import { onHand, reorderAlerts } from "@/lib/ops-floor";
import { useStore } from "@/lib/store";

export default function InventoryPage() {
  const { lots, ingredients, csLogs, receiveLot, setIngredientReorder } = useStore();
  const [ingredientId, setIngredientId] = useState(ingredients[0]?.id || "");
  const [lotNumber, setLotNumber] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [qty, setQty] = useState("25");
  const [unit, setUnit] = useState(ingredients[0]?.unit || "g");
  const [expires, setExpires] = useState("");
  const [location, setLocation] = useState("");
  const [aux, setAux] = useState("");
  const [cas, setCas] = useState(ingredients[0]?.cas || "");
  const [coa, setCoa] = useState("");
  const [potency, setPotency] = useState("99.5");
  const alerts = lotAlerts(lots);
  const low = reorderAlerts(ingredients, lots);
  const selected = getIngredient(ingredientId, ingredients);

  return (
    <OpsGate>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-mid">Operations inventory</p>
        <h1 className="mt-2 text-3xl font-semibold">Receive lots</h1>
        <p className="mt-2 max-w-2xl text-ink-soft">
          Enter manufacturer, lot #, storage location, units, auxiliary labels, and CAS. Reorder
          points sit on the ingredient — FEFO still applies during compounding.
        </p>

        {low.length ? (
          <div className="mt-4 rounded-xl border border-danger/30 bg-paper p-4 text-sm">
            <p className="font-semibold text-danger">Below reorder point</p>
            <ul className="mt-2 space-y-1">
              {low.map((row) => (
                <li key={row.ingredient.id}>
                  {row.ingredient.name} · {row.remaining} {row.ingredient.unit} on hand (reorder {row.point})
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <form
          className="mt-6 grid gap-3 rounded-xl border border-line bg-paper p-5 md:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault();
            const ing = getIngredient(ingredientId, ingredients);
            if (!ing || !lotNumber || !expires) return;
            receiveLot({
              ingredientId,
              lotNumber,
              supplier: manufacturer || "Receiving",
              manufacturer: manufacturer || "Receiving",
              storageLocation: location,
              auxiliaryLabels: aux,
              cas: cas || ing.cas,
              receivedAt: new Date().toISOString(),
              expiresAt: new Date(expires).toISOString(),
              quantity: Number(qty) || 0,
              unit: unit || ing.unit,
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
            <select
              className="mt-1 w-full rounded-lg border border-line px-3 py-2"
              value={ingredientId}
              onChange={(e) => {
                const next = getIngredient(e.target.value, ingredients);
                setIngredientId(e.target.value);
                setUnit(next?.unit || "g");
                setCas(next?.cas || "");
              }}
            >
              {ingredients.map((ing) => (
                <option key={ing.id} value={ing.id}>{ing.name}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Manufacturer
            <input className="mt-1 w-full rounded-lg border border-line px-3 py-2" value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} placeholder="PCCA, Medisca…" required />
          </label>
          <label className="text-sm">
            Lot #
            <input className="mt-1 w-full rounded-lg border border-line px-3 py-2" value={lotNumber} onChange={(e) => setLotNumber(e.target.value)} required />
          </label>
          <label className="text-sm">
            Storage location
            <input className="mt-1 w-full rounded-lg border border-line px-3 py-2" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="HD cage A / CRT shelf 2" />
          </label>
          <label className="text-sm">
            Units
            <input className="mt-1 w-full rounded-lg border border-line px-3 py-2" value={qty} onChange={(e) => setQty(e.target.value)} />
          </label>
          <label className="text-sm">
            Unit of measure
            <input className="mt-1 w-full rounded-lg border border-line px-3 py-2" value={unit} onChange={(e) => setUnit(e.target.value)} />
          </label>
          <label className="text-sm">
            Auxiliary labels
            <input className="mt-1 w-full rounded-lg border border-line px-3 py-2" value={aux} onChange={(e) => setAux(e.target.value)} placeholder="USP <800> · Protect from light" />
          </label>
          <label className="text-sm">
            CAS #
            <input className="mt-1 w-full rounded-lg border border-line px-3 py-2" value={cas} onChange={(e) => setCas(e.target.value)} placeholder="50-28-2" />
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
          <label className="text-sm">
            Reorder point ({selected?.unit})
            <input
              className="mt-1 w-full rounded-lg border border-line px-3 py-2"
              value={selected?.reorderPoint ?? ""}
              onChange={(e) => setIngredientReorder(ingredientId, Number(e.target.value) || 0)}
            />
          </label>
          <button type="submit" className="rounded-lg bg-purple-deep px-4 py-2 text-sm font-semibold text-white md:col-span-3">
            Receive lot
          </button>
        </form>

        <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-paper">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="bg-[#f7f5ee] text-[11px] uppercase tracking-[0.08em] text-ink-soft">
              <tr>
                <th className="px-3 py-2">Lot #</th>
                <th className="px-3 py-2">Ingredient</th>
                <th className="px-3 py-2">Manufacturer</th>
                <th className="px-3 py-2">Location</th>
                <th className="px-3 py-2">On hand</th>
                <th className="px-3 py-2">CAS</th>
                <th className="px-3 py-2">Aux labels</th>
                <th className="px-3 py-2">Expires</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map(({ lot, expired, expiringSoon }) => {
                const ing = getIngredient(lot.ingredientId, ingredients);
                const remainingAll = onHand(lot.ingredientId, lots);
                const lowStock = Boolean(ing && remainingAll < (ing.reorderPoint || 0));
                return (
                  <tr key={lot.id} className="border-t border-line">
                    <td className="px-3 py-2">{lot.lotNumber}</td>
                    <td className="px-3 py-2">
                      {ing?.name}
                      {ing?.nioshTable ? <span className="ml-1 text-danger">NIOSH T{ing.nioshTable}</span> : null}
                    </td>
                    <td className="px-3 py-2">{lot.manufacturer || lot.supplier}</td>
                    <td className="px-3 py-2">{lot.storageLocation || "—"}</td>
                    <td className="px-3 py-2">
                      {lot.remaining} / {lot.quantity} {lot.unit}
                      {lowStock ? <span className="ml-1 text-danger">reorder</span> : null}
                    </td>
                    <td className="px-3 py-2">{lot.cas || ing?.cas || "—"}</td>
                    <td className="px-3 py-2">{lot.auxiliaryLabels || "—"}</td>
                    <td className="px-3 py-2">{formatDate(lot.expiresAt)}</td>
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

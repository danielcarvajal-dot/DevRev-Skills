"use client";

import { use } from "react";
import Link from "next/link";
import { OpsGate } from "@/components/OpsGate";
import { daysFromHours } from "@/lib/bud";
import { formatDate, orderNumber } from "@/lib/format";
import { CR_STAGE_LABEL } from "@/lib/lims";
import { getIngredient } from "@/lib/lims-catalog";
import { useStore } from "@/lib/store";

export default function BatchWorkbenchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { crs, mfrs, ingredients, lots, orders, documents, advanceBatch, assignMfr } = useStore();
  const cr = crs.find((item) => item.id === id);
  const mfr = mfrs.find((item) => item.id === cr?.mfrId);
  const order = orders.find((item) => item.id === cr?.orderId);
  const relatedDocs = documents.filter((doc) => doc.orderId === cr?.orderId);

  if (!cr) {
    return (
      <OpsGate>
        <div className="mx-auto max-w-3xl px-4 py-16">
          <h1 className="text-3xl font-semibold">Compounding record not found</h1>
          <Link href="/ops" className="mt-4 inline-block underline">Back to lab</Link>
        </div>
      </OpsGate>
    );
  }

  return (
    <OpsGate>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Link href="/ops" className="text-sm underline">Lab pipeline</Link>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-purple-mid">
          Compounding record · {CR_STAGE_LABEL[cr.stage]}
          {cr.hd ? " · USP <800> HD" : ""}
        </p>
        <h1 className="mt-2 text-3xl font-semibold">
          {cr.productName} · {cr.doseLabel}
        </h1>
        <p className="mt-2 text-ink-soft">
          {cr.patientName} · portal {orderNumber(cr.orderId)} · {cr.batchLot}
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {cr.stage !== "shipped" ? (
            <button
              type="button"
              className="rounded-lg bg-purple-deep px-4 py-2 text-sm font-semibold text-white"
              onClick={() => {
                const error = advanceBatch(cr.id);
                if (error) alert(error);
              }}
            >
              Advance to next stage
            </button>
          ) : null}
          {order ? (
            <Link href={`/order/${order.id}`} className="rounded-lg border border-line px-4 py-2 text-sm">
              Portal ticket
            </Link>
          ) : null}
        </div>

        <section className="mt-6 rounded-xl border border-line bg-paper p-5">
          <h2 className="font-semibold">1. Order intake</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Received from the provider portal. Rx / PA / formula documents stay on the ticket; the
            lab does not send compounding math back.
          </p>
          {order ? (
            <p className="mt-2 text-sm">
              Prescriber {order.prescriberName} · {order.practiceName}
              {order.notes ? ` · Note: ${order.notes}` : ""}
            </p>
          ) : null}
          <ul className="mt-2 text-sm">
            {relatedDocs.map((doc) => (
              <li key={doc.id}>{doc.kind.toUpperCase()} · {doc.name}</li>
            ))}
            {relatedDocs.length === 0 ? <li className="text-ink-soft">No files on this demo ticket.</li> : null}
          </ul>
        </section>

        <section className="mt-4 rounded-xl border border-line bg-paper p-5">
          <h2 className="font-semibold">2. Formula / recipe (MFR)</h2>
          <label className="mt-3 block text-sm">
            Assigned MFR
            <select
              className="mt-1 w-full rounded-lg border border-line px-3 py-2"
              value={cr.mfrId}
              onChange={(e) => assignMfr(cr.id, e.target.value)}
            >
              <option value="">Select MFR</option>
              {mfrs.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          </label>
          {mfr ? (
            <p className="mt-2 text-sm">
              <Link href={`/ops/mfr/${mfr.id}`} className="underline">
                Open {mfr.title}
              </Link>
              {" · "}USP &lt;{mfr.uspChapter}&gt; · {mfr.vehicle}
            </p>
          ) : (
            <p className="mt-2 text-sm text-danger">No MFR assigned — cannot compound.</p>
          )}
        </section>

        <section className="mt-4 rounded-xl border border-line bg-paper p-5">
          <h2 className="font-semibold">3. Batch production · lot traceability</h2>
          {cr.ingredientsUsed.length === 0 ? (
            <p className="mt-2 text-sm text-ink-soft">
              Advance from formula to lock FEFO lots, potency-adjusted weighs, and BUD.
            </p>
          ) : (
            <table className="mt-3 w-full text-left text-sm">
              <thead className="text-[11px] uppercase tracking-[0.08em] text-ink-soft">
                <tr>
                  <th className="py-2">Ingredient</th>
                  <th>Lot</th>
                  <th>Formula</th>
                  <th>Weigh (potency adj.)</th>
                  <th>Assay</th>
                </tr>
              </thead>
              <tbody>
                {cr.ingredientsUsed.map((row) => {
                  const ing = getIngredient(row.ingredientId, ingredients);
                  const lot = lots.find((item) => item.id === row.lotId);
                  return (
                    <tr key={`${row.ingredientId}-${row.lotId}`} className="border-t border-line">
                      <td className="py-2">
                        {ing?.name}
                        {ing?.hazardous ? <span className="ml-1 text-danger">HD</span> : null}
                        {ing?.controlledSchedule ? <span className="ml-1">C-{ing.controlledSchedule}</span> : null}
                      </td>
                      <td>{lot?.lotNumber || "—"}</td>
                      <td>
                        {row.formulaQty} {row.unit}
                      </td>
                      <td>
                        {row.weighedQty} {row.unit}
                      </td>
                      <td>{row.potencyPct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

        <section className="mt-4 rounded-xl border border-line bg-paper p-5">
          <h2 className="font-semibold">BUD calculation</h2>
          {cr.budHours ? (
            <>
              <p className="mt-2 text-sm">
                {daysFromHours(cr.budHours)} · store {cr.budStorage} · BUD{" "}
                {formatDate(cr.budDate)} · capped by {cr.budCappedBy}
              </p>
              <p className="mt-1 text-sm text-ink-soft">{cr.budBasis}</p>
            </>
          ) : (
            <p className="mt-2 text-sm text-ink-soft">Calculated when the batch leaves the formula stage.</p>
          )}
        </section>

        <section className="mt-4 rounded-xl border border-line bg-paper p-5">
          <h2 className="font-semibold">4–5. Labeling · dispensing / shipping</h2>
          {cr.labelPrinted ? (
            <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-purple-soft/40 p-4 text-sm">{cr.labelText}</pre>
          ) : (
            <p className="mt-2 text-sm text-ink-soft">
              Label prints at the labeling → dispense step and includes BUD, storage, and HD/CS warnings.
            </p>
          )}
        </section>
      </div>
    </OpsGate>
  );
}

"use client";

import { use } from "react";
import Link from "next/link";
import { OpsGate } from "@/components/OpsGate";
import { calculateBud, daysFromHours } from "@/lib/bud";
import { getIngredient } from "@/lib/lims-catalog";
import { useStore } from "@/lib/store";

export default function MfrDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { mfrs, ingredients, lots } = useStore();
  const mfr = mfrs.find((item) => item.id === id);
  if (!mfr) {
    return (
      <OpsGate>
        <div className="mx-auto max-w-3xl px-4 py-16">
          <h1 className="text-3xl font-semibold">MFR not found</h1>
          <Link href="/ops/mfr" className="mt-4 inline-block underline">Back to MFRs</Link>
        </div>
      </OpsGate>
    );
  }
  const expires = mfr.ingredients
    .map((line) => lots.find((lot) => lot.ingredientId === line.ingredientId && !lot.quarantine)?.expiresAt)
    .filter((value): value is string => Boolean(value));
  const preview = calculateBud({
    chapter: mfr.uspChapter,
    compoundedAt: new Date().toISOString(),
    vehicle: mfr.vehicle,
    refrigerated: mfr.refrigerated,
    sterileCategory: mfr.sterileCategory,
    startingComponentsSterile: mfr.startingComponentsSterile,
    stabilityDays: mfr.stabilityDays,
    ingredientExpires: expires,
  });

  return (
    <OpsGate>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Link href="/ops/mfr" className="text-sm underline">All MFRs</Link>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-purple-mid">
          Master Formulation Record · USP &lt;{mfr.uspChapter}&gt;
        </p>
        <h1 className="mt-2 text-3xl font-semibold">{mfr.title}</h1>
        <p className="mt-2 text-ink-soft">
          {mfr.dosageForm} · {mfr.strength} · {mfr.batchSize} {mfr.batchUnit}
        </p>

        {mfr.hdPrecautions ? (
          <p className="mt-4 rounded-lg border border-danger/30 bg-paper px-4 py-3 text-sm text-danger">
            USP &lt;800&gt;: {mfr.hdPrecautions}
          </p>
        ) : null}

        <section className="mt-6 rounded-xl border border-line bg-paper p-5">
          <h2 className="font-semibold">BUD engine preview</h2>
          <p className="mt-2 text-sm">
            {daysFromHours(preview.hours)} · {preview.storage} · capped by {preview.cappedBy}
          </p>
          <p className="mt-1 text-sm text-ink-soft">{preview.basis}</p>
          {mfr.stabilityDays ? (
            <p className="mt-2 text-sm">In-house stability file: {mfr.stabilityDays} days.</p>
          ) : (
            <p className="mt-2 text-sm text-ink-soft">No stability study on file — chapter default applies.</p>
          )}
        </section>

        <section className="mt-4 rounded-xl border border-line bg-paper p-5">
          <h2 className="font-semibold">Formula</h2>
          <table className="mt-3 w-full text-left text-sm">
            <thead className="text-[11px] uppercase tracking-[0.08em] text-ink-soft">
              <tr>
                <th className="py-2">Ingredient</th>
                <th>Qty</th>
                <th>Role</th>
                <th>NIOSH</th>
              </tr>
            </thead>
            <tbody>
              {mfr.ingredients.map((line) => {
                const ing = getIngredient(line.ingredientId, ingredients);
                return (
                  <tr key={line.ingredientId} className="border-t border-line">
                    <td className="py-2">{ing?.name}</td>
                    <td>
                      {line.quantity} {line.unit}
                    </td>
                    <td>{line.role}</td>
                    <td className={ing?.hazardous ? "text-danger" : ""}>
                      {ing?.nioshTable ? `Table ${ing.nioshTable}` : "—"}
                      {ing?.controlledSchedule ? ` · C-${ing.controlledSchedule}` : ""}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <section className="mt-4 rounded-xl border border-line bg-paper p-5">
          <h2 className="font-semibold">Procedure</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
            {mfr.procedure.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <h2 className="mt-4 font-semibold">QC</h2>
          <ul className="mt-2 list-disc pl-5 text-sm">
            {mfr.qualityChecks.map((check) => (
              <li key={check}>{check}</li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-ink-soft">
            Container: {mfr.container}. Storage: {mfr.storage}.
          </p>
        </section>
      </div>
    </OpsGate>
  );
}

"use client";

import { OpsGate } from "@/components/OpsGate";
import { useStore } from "@/lib/store";

export default function IngredientsPage() {
  const { ingredients } = useStore();
  const hd = ingredients.filter((ing) => ing.hazardous);
  return (
    <OpsGate>
      <div className="mx-auto max-w-5xl px-4 py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-mid">USP &lt;800&gt;</p>
        <h1 className="mt-2 text-3xl font-semibold">Hazardous drug list (NIOSH)</h1>
        <p className="mt-2 max-w-2xl text-ink-soft">
          Ingredients tagged to NIOSH tables. Table 1 antineoplastics, Table 2 non-antineoplastic
          HDs, Table 3 reproductive risk. Tagging drives C-PEC / PPE on the MFR and HD warnings on
          the compounding record — never shown to the provider portal.
        </p>
        <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-paper">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-[#fbf9fe] text-[11px] uppercase tracking-[0.08em] text-ink-soft">
              <tr>
                <th className="px-3 py-2">Ingredient</th>
                <th className="px-3 py-2">CAS</th>
                <th className="px-3 py-2">NIOSH</th>
                <th className="px-3 py-2">HD</th>
                <th className="px-3 py-2">CS</th>
              </tr>
            </thead>
            <tbody>
              {ingredients.map((ing) => (
                <tr key={ing.id} className="border-t border-line">
                  <td className="px-3 py-2">{ing.name}</td>
                  <td className="px-3 py-2">{ing.cas || "—"}</td>
                  <td className={`px-3 py-2 ${ing.nioshTable ? "text-danger" : ""}`}>
                    {ing.nioshTable ? `Table ${ing.nioshTable}` : "—"}
                  </td>
                  <td className="px-3 py-2">{ing.hazardous ? "Yes" : "No"}</td>
                  <td className="px-3 py-2">{ing.controlledSchedule ? `C-${ing.controlledSchedule}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-ink-soft">{hd.length} ingredients on the HD list.</p>
      </div>
    </OpsGate>
  );
}

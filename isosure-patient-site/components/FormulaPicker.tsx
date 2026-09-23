"use client";

import type { Formula } from "@/lib/formulas";
import { formulaCategories, formulationsInMedication, medicationsInCategory } from "@/lib/formulas";

export function FormulaPicker({
  formulas,
  category,
  medication,
  selected,
  doseId,
  showIngredients,
  onCategory,
  onMedication,
  onFormulation,
  onStrength,
  onToggleIngredients,
}: {
  formulas: Formula[];
  category: string;
  medication: string;
  selected: Formula | null;
  doseId: string;
  showIngredients: boolean;
  onCategory: (category: string) => void;
  onMedication: (medication: string) => void;
  onFormulation: (productId: string) => void;
  onStrength: (doseId: string) => void;
  onToggleIngredients: () => void;
}) {
  const medications = category ? medicationsInCategory(formulas, category) : [];
  const formulations = category && medication ? formulationsInMedication(formulas, category, medication) : [];
  const strengths = selected?.strengths ?? [];

  return (
    <div className="space-y-4 rounded-xl border border-line bg-paper p-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-purple-mid">Formula selection</p>
        <h2 className="mt-1 text-xl font-semibold">What would you like to order?</h2>
        <p className="mt-2 text-sm text-ink-soft">
          All medications in the selected category appear here, with the strengths this pharmacy currently offers.
        </p>
      </div>

      <label className="block text-sm">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft">Category</span>
        <select
          className="mt-1 w-full rounded-lg border border-line px-3 py-2"
          value={category}
          onChange={(e) => onCategory(e.target.value)}
        >
          <option value="">Select a category</option>
          {formulaCategories().map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft">Medication</span>
        <select
          className="mt-1 w-full rounded-lg border border-line px-3 py-2"
          value={medication}
          disabled={!category}
          onChange={(e) => onMedication(e.target.value)}
        >
          <option value="">{category ? "Select a medication" : "Select a category first"}</option>
          {medications.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft">Formulation</span>
        <select
          className="mt-1 w-full rounded-lg border border-line px-3 py-2"
          value={selected?.productId || ""}
          disabled={!medication}
          onChange={(e) => onFormulation(e.target.value)}
        >
          <option value="">{medication ? "Select a formulation" : "Select a medication first"}</option>
          {formulations.map((item) => (
            <option key={item.productId} value={item.productId}>
              {item.formulation}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft">Strength</span>
        <select
          className="mt-1 w-full rounded-lg border border-line px-3 py-2"
          value={doseId}
          disabled={!selected}
          onChange={(e) => onStrength(e.target.value)}
        >
          <option value="">{selected ? "Select a strength" : "Select a formulation first"}</option>
          {strengths.map((item) => (
            <option key={item.doseId} value={item.doseId}>
              {item.label}
            </option>
          ))}
        </select>
        {selected ? (
          <p className="mt-1 text-xs text-ink-soft">Strengths currently offered for this formula.</p>
        ) : null}
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <p className="text-sm">
          <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft">Dosage form</span>
          <span className="mt-1 block rounded-lg border border-line bg-bg px-3 py-2">{selected?.dosageForm || "—"}</span>
        </p>
        <p className="text-sm">
          <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft">Route (dosage form)</span>
          <span className="mt-1 block rounded-lg border border-line bg-bg px-3 py-2">{selected?.route || "—"}</span>
        </p>
      </div>

      {selected ? (
        <div className="rounded-lg border border-line bg-bg px-3 py-2">
          <button type="button" className="text-sm font-semibold underline underline-offset-4" onClick={onToggleIngredients}>
            {showIngredients ? "Hide ingredients" : "See ingredients inside this formula"}
          </button>
          {showIngredients ? (
            <ul className="mt-3 space-y-1 text-sm">
              {selected.ingredients.map((item) => (
                <li key={`${item.role}-${item.name}`} className="flex justify-between gap-3">
                  <span>{item.name}</span>
                  <span className="text-ink-soft">{item.role}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

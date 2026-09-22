import { getIngredient } from "./lims-catalog";
import type {
  CompoundingRecord,
  CrPriority,
  Ingredient,
  InventoryLot,
  MasterFormulationRecord,
} from "./lims-types";

export const LAB_TECHS = ["Alex Chen", "Priya Shah", "Morgan Lee"] as const;

export function roundUpToBatch(ordered: number, batchSize: number) {
  const qty = Number(ordered);
  const batch = Number(batchSize);
  if (!Number.isFinite(qty) || qty <= 0) return batch > 0 ? batch : 1;
  if (!Number.isFinite(batch) || batch <= 0) return Math.ceil(qty);
  return Math.ceil(qty / batch) * batch;
}

export function normalizeCr(cr: CompoundingRecord): CompoundingRecord {
  const orderedQty = cr.orderedQty ?? 1;
  return {
    ...cr,
    orderedQty,
    compoundQty: cr.compoundQty ?? orderedQty,
    qtyManuallyAdjusted: Boolean(cr.qtyManuallyAdjusted),
    priority: cr.priority ?? (cr.hd ? "today" : "routine"),
    assignedTech: cr.assignedTech ?? "",
    sortIndex: cr.sortIndex ?? 0,
  };
}

export function isSterile(mfr: MasterFormulationRecord | undefined) {
  return mfr?.uspChapter === "797";
}

export function primaryApi(
  cr: CompoundingRecord,
  mfrs: MasterFormulationRecord[],
  ingredients: Ingredient[],
) {
  const mfr = mfrs.find((item) => item.id === cr.mfrId);
  const line = mfr?.ingredients.find((item) => item.role === "API") || mfr?.ingredients[0];
  if (!line) return null;
  return getIngredient(line.ingredientId, ingredients) || null;
}

export function kpiPoints(cr: CompoundingRecord, mfr?: MasterFormulationRecord) {
  let points = 1;
  if (cr.hd) points += 2;
  if (isSterile(mfr)) points += 2;
  if (cr.priority === "stat") points += 2;
  if (cr.priority === "today") points += 1;
  return points;
}

export type FloorFilter = "all" | "priority" | "hd" | "sterile" | "nonsterile";

export function filterFloor(
  crs: CompoundingRecord[],
  mfrs: MasterFormulationRecord[],
  filter: FloorFilter,
) {
  const open = crs.filter((cr) => cr.stage !== "shipped").map(normalizeCr);
  return open
    .filter((cr) => {
      const mfr = mfrs.find((item) => item.id === cr.mfrId);
      if (filter === "priority") return cr.priority === "stat" || cr.priority === "today";
      if (filter === "hd") return cr.hd;
      if (filter === "sterile") return isSterile(mfr);
      if (filter === "nonsterile") return !isSterile(mfr);
      return true;
    })
    .sort((a, b) => {
      const rank = { stat: 0, today: 1, routine: 2 };
      const byPriority = rank[a.priority ?? "routine"] - rank[b.priority ?? "routine"];
      if (byPriority !== 0) return byPriority;
      return (a.sortIndex ?? 0) - (b.sortIndex ?? 0);
    });
}

export type ApiGroup = {
  apiId: string;
  apiName: string;
  cas: string;
  compounds: CompoundingRecord[];
  points: number;
};

export function groupByApi(
  crs: CompoundingRecord[],
  mfrs: MasterFormulationRecord[],
  ingredients: Ingredient[],
): ApiGroup[] {
  const groups = new Map<string, ApiGroup>();
  for (const cr of crs) {
    const api = primaryApi(cr, mfrs, ingredients);
    const apiId = api?.id || "unmapped";
    const existing = groups.get(apiId) || {
      apiId,
      apiName: api?.name || "Unmapped API",
      cas: api?.cas || "",
      compounds: [],
      points: 0,
    };
    const mfr = mfrs.find((item) => item.id === cr.mfrId);
    existing.compounds.push(cr);
    existing.points += kpiPoints(cr, mfr);
    groups.set(apiId, existing);
  }
  return [...groups.values()].sort((a, b) => b.compounds.length - a.compounds.length);
}

export function onHand(ingredientId: string, lots: InventoryLot[]) {
  return lots
    .filter(
      (lot) =>
        lot.ingredientId === ingredientId &&
        !lot.quarantine &&
        new Date(lot.expiresAt) > new Date(),
    )
    .reduce((sum, lot) => sum + lot.remaining, 0);
}

export function reorderAlerts(ingredients: Ingredient[], lots: InventoryLot[]) {
  return ingredients
    .map((ingredient) => {
      const remaining = onHand(ingredient.id, lots);
      const point = ingredient.reorderPoint ?? 0;
      const stocked = lots.some((lot) => lot.ingredientId === ingredient.id);
      return { ingredient, remaining, point, low: point > 0 && stocked && remaining < point };
    })
    .filter((row) => row.low);
}

export function priorityLabel(priority: CrPriority | undefined) {
  if (priority === "stat") return "STAT";
  if (priority === "today") return "Today";
  return "Routine";
}

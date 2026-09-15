import { calculateBud, potencyAdjustedQty } from "./bud";
import { findMfr, getIngredient } from "./lims-catalog";
import type {
  CompoundingRecord,
  ControlledSubstanceLog,
  CrStage,
  Ingredient,
  InventoryLot,
  MasterFormulationRecord,
} from "./lims-types";
import type { Order as PortalOrder, OrderStatus } from "./types";

export { CR_STAGE_LABEL, CR_STAGES } from "./lims-types";

const NEXT_STAGE: Record<CrStage, CrStage | null> = {
  intake: "formula",
  formula: "compounding",
  compounding: "labeling",
  labeling: "dispense",
  dispense: "shipped",
  shipped: null,
};

export function stageToOrderStatus(stage: CrStage): OrderStatus {
  switch (stage) {
    case "intake":
      return "Received";
    case "formula":
    case "compounding":
    case "labeling":
      return "InProduction";
    case "dispense":
      return "ReadyPickup";
    case "shipped":
      return "OutForDelivery";
  }
}

export function aggregateOrderStatus(stages: CrStage[]): OrderStatus | null {
  if (!stages.length) return null;
  const rank: CrStage[] = ["intake", "formula", "compounding", "labeling", "dispense", "shipped"];
  const lowest = stages.reduce((min, stage) => (rank.indexOf(stage) < rank.indexOf(min) ? stage : min));
  return stageToOrderStatus(lowest);
}

function batchLot() {
  const n = Math.floor(Math.random() * 9000 + 1000);
  return `CR-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${n}`;
}

export function pickLot(ingredientId: string, lots: InventoryLot[]) {
  return lots
    .filter((lot) => lot.ingredientId === ingredientId && !lot.quarantine && lot.remaining > 0 && new Date(lot.expiresAt) > new Date())
    .sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime())[0];
}

export function createCrsForOrder(input: {
  order: PortalOrder;
  mfrs: MasterFormulationRecord[];
  ingredients: Ingredient[];
  pharmacist: string;
}): CompoundingRecord[] {
  return input.order.items.map((item, itemIndex) => {
    const mfr = findMfr(item.productId, item.doseId, input.mfrs);
    const hd = Boolean(
      mfr?.ingredients.some((line) => getIngredient(line.ingredientId, input.ingredients)?.hazardous),
    );
    return {
      id: crypto.randomUUID(),
      mfrId: mfr?.id || "",
      orderId: input.order.id,
      itemIndex,
      productName: item.productName,
      doseLabel: item.doseLabel,
      patientName: input.order.patientName,
      batchLot: batchLot(),
      stage: "intake" as const,
      createdAt: new Date().toISOString(),
      compoundedBy: input.pharmacist,
      verifiedBy: "",
      ingredientsUsed: [],
      budDate: "",
      budHours: 0,
      budBasis: "",
      budStorage: "CRT" as const,
      budCappedBy: "chapter" as const,
      labelPrinted: false,
      labelText: "",
      notes: input.order.notes,
      hd,
    };
  });
}

export function assignLotsAndBud(
  cr: CompoundingRecord,
  mfr: MasterFormulationRecord,
  lots: InventoryLot[],
  ingredients: Ingredient[],
): { cr: CompoundingRecord; missing: string[] } {
  const missing: string[] = [];
  const used = mfr.ingredients.map((line) => {
    const lot = pickLot(line.ingredientId, lots);
    const ing = getIngredient(line.ingredientId, ingredients);
    if (!lot) {
      missing.push(ing?.name || line.ingredientId);
      return {
        ingredientId: line.ingredientId,
        lotId: "",
        formulaQty: line.quantity,
        weighedQty: line.quantity,
        unit: line.unit,
        potencyPct: ing?.defaultPotencyPct || 100,
      };
    }
    const weighedQty = potencyAdjustedQty(line.quantity, lot.potencyPct);
    return {
      ingredientId: line.ingredientId,
      lotId: lot.id,
      formulaQty: line.quantity,
      weighedQty,
      unit: line.unit,
      potencyPct: lot.potencyPct,
    };
  });
  const expires = used
    .map((row) => lots.find((lot) => lot.id === row.lotId)?.expiresAt)
    .filter((value): value is string => Boolean(value));
  const bud = calculateBud({
    chapter: mfr.uspChapter,
    compoundedAt: new Date().toISOString(),
    vehicle: mfr.vehicle,
    refrigerated: mfr.refrigerated,
    sterileCategory: mfr.sterileCategory,
    startingComponentsSterile: mfr.startingComponentsSterile,
    ingredientExpires: expires,
    stabilityDays: mfr.stabilityDays,
  });
  return {
    missing,
    cr: {
      ...cr,
      mfrId: mfr.id,
      ingredientsUsed: used,
      compoundedAt: new Date().toISOString(),
      budDate: bud.date,
      budHours: bud.hours,
      budBasis: bud.basis,
      budStorage: bud.storage,
      budCappedBy: bud.cappedBy,
      hd: mfr.ingredients.some((line) => getIngredient(line.ingredientId, ingredients)?.hazardous) || cr.hd,
    },
  };
}

export function buildLabel(cr: CompoundingRecord, mfr: MasterFormulationRecord) {
  const budDay = cr.budDate ? new Date(cr.budDate).toLocaleDateString() : "—";
  const hd = cr.hd ? "HAZARDOUS DRUG — USP <800>\n" : "";
  const cs = mfr.ingredients.some((line) => line.ingredientId === "testosterone") ? "C-III  " : "";
  return [
    `${cs}${cr.productName} ${cr.doseLabel}`,
    `Patient: ${cr.patientName}`,
    `Batch ${cr.batchLot}`,
    `BUD ${budDay} · store ${cr.budStorage}`,
    `${hd}${mfr.labeling.join(" · ")}`,
    `USP <${mfr.uspChapter}>  ${mfr.container}`,
  ].join("\n");
}

export function consumeLots(
  lots: InventoryLot[],
  cr: CompoundingRecord,
  ingredients: Ingredient[],
  pharmacist: string,
): { lots: InventoryLot[]; csLogs: ControlledSubstanceLog[] } {
  const csLogs: ControlledSubstanceLog[] = [];
  const nextLots = lots.map((lot) => {
    const use = cr.ingredientsUsed.find((row) => row.lotId === lot.id);
    if (!use) return lot;
    const remaining = Math.max(0, Math.round((lot.remaining - use.weighedQty) * 1000) / 1000);
    const ing = getIngredient(use.ingredientId, ingredients);
    if (ing?.controlledSchedule) {
      csLogs.push({
        id: crypto.randomUUID(),
        at: new Date().toISOString(),
        ingredientId: ing.id,
        lotId: lot.id,
        crId: cr.id,
        quantity: use.weighedQty,
        unit: use.unit,
        remaining,
        pharmacist,
      });
    }
    return { ...lot, remaining };
  });
  return { lots: nextLots, csLogs };
}

export function advanceCr(input: {
  cr: CompoundingRecord;
  mfrs: MasterFormulationRecord[];
  lots: InventoryLot[];
  ingredients: Ingredient[];
  pharmacist: string;
}): {
  cr: CompoundingRecord;
  lots: InventoryLot[];
  csLogs: ControlledSubstanceLog[];
  error?: string;
} {
  const next = NEXT_STAGE[input.cr.stage];
  if (!next) return { cr: input.cr, lots: input.lots, csLogs: [] };
  const mfr = input.mfrs.find((item) => item.id === input.cr.mfrId);
  if (next === "formula" && !mfr) {
    return { cr: input.cr, lots: input.lots, csLogs: [], error: "Assign an MFR before leaving intake." };
  }
  if (next === "compounding") {
    if (!mfr) return { cr: input.cr, lots: input.lots, csLogs: [], error: "MFR required." };
    const assigned = assignLotsAndBud(input.cr, mfr, input.lots, input.ingredients);
    if (assigned.missing.length) {
      return {
        cr: input.cr,
        lots: input.lots,
        csLogs: [],
        error: `Missing usable lot for: ${assigned.missing.join(", ")}`,
      };
    }
    return { cr: { ...assigned.cr, stage: next }, lots: input.lots, csLogs: [] };
  }
  if (next === "labeling") {
    if (!mfr) return { cr: input.cr, lots: input.lots, csLogs: [], error: "MFR required." };
    const consumed = consumeLots(input.lots, input.cr, input.ingredients, input.pharmacist);
    return {
      cr: { ...input.cr, stage: next, verifiedBy: input.pharmacist },
      lots: consumed.lots,
      csLogs: consumed.csLogs,
    };
  }
  if (next === "dispense") {
    if (!mfr) return { cr: input.cr, lots: input.lots, csLogs: [], error: "MFR required." };
    const labelText = buildLabel({ ...input.cr, labelPrinted: true }, mfr);
    return {
      cr: { ...input.cr, stage: next, labelPrinted: true, labelText },
      lots: input.lots,
      csLogs: [],
    };
  }
  return { cr: { ...input.cr, stage: next }, lots: input.lots, csLogs: [] };
}

export function seedDemoCrs(): CompoundingRecord[] {
  const now = Date.now();
  return [
    {
      id: "cr-e2-1",
      mfrId: "mfr-e2-05",
      orderId: "demo-order-1",
      itemIndex: 0,
      productName: "IsoBalance Estradiol Cream",
      doseLabel: "0.5 mg/g",
      patientName: "Avery Nguyen",
      batchLot: "CR-20260814-4412",
      stage: "compounding",
      createdAt: new Date(now - 12 * 864e5).toISOString(),
      compoundedAt: new Date(now - 11 * 864e5).toISOString(),
      compoundedBy: "Jordan Hale, RPh",
      verifiedBy: "",
      ingredientsUsed: [
        { ingredientId: "estradiol", lotId: "lot-e2-a", formulaQty: 0.015, weighedQty: 0.015, unit: "g", potencyPct: 99.2 },
        { ingredientId: "parabens", lotId: "lot-parab-a", formulaQty: 0.06, weighedQty: 0.06, unit: "g", potencyPct: 100 },
        { ingredientId: "versabase", lotId: "lot-vb-a", formulaQty: 29.925, weighedQty: 29.925, unit: "g", potencyPct: 100 },
      ],
      budDate: new Date(now - 12 * 864e5 + 35 * 864e5).toISOString(),
      budHours: 35 * 24,
      budBasis: "USP <795> default for preserved aqueous: 35 days CRT or refrigerated",
      budStorage: "CRT",
      budCappedBy: "chapter",
      labelPrinted: false,
      labelText: "",
      notes: "Match last fill.",
      hd: true,
    },
    {
      id: "cr-p4-1",
      mfrId: "mfr-p4-100",
      orderId: "demo-order-1",
      itemIndex: 1,
      productName: "IsoCalm Progesterone Capsules",
      doseLabel: "100 mg",
      patientName: "Avery Nguyen",
      batchLot: "CR-20260814-4413",
      stage: "formula",
      createdAt: new Date(now - 12 * 864e5).toISOString(),
      compoundedBy: "Jordan Hale, RPh",
      verifiedBy: "",
      ingredientsUsed: [],
      budDate: "",
      budHours: 0,
      budBasis: "",
      budStorage: "CRT",
      budCappedBy: "chapter",
      labelPrinted: false,
      labelText: "",
      notes: "Match last fill.",
      hd: true,
    },
    {
      id: "cr-ldn-2",
      mfrId: "mfr-ldn-45",
      orderId: "demo-order-2",
      itemIndex: 0,
      productName: "IsoReset Low-Dose Naltrexone",
      doseLabel: "4.5 mg",
      patientName: "Sam Rivera",
      batchLot: "CR-20260822-1090",
      stage: "intake",
      createdAt: new Date(now - 4 * 864e5).toISOString(),
      compoundedBy: "Jordan Hale, RPh",
      verifiedBy: "",
      ingredientsUsed: [],
      budDate: "",
      budHours: 0,
      budBasis: "",
      budStorage: "CRT",
      budCappedBy: "chapter",
      labelPrinted: false,
      labelText: "",
      notes: "Clarification pending from provider.",
      hd: false,
    },
    {
      id: "cr-keto-3",
      mfrId: "mfr-keto-10",
      orderId: "demo-order-3",
      itemIndex: 0,
      productName: "IsoEase Ketoprofen Cream",
      doseLabel: "10%",
      patientName: "Lee Park",
      batchLot: "CR-20260824-7721",
      stage: "dispense",
      createdAt: new Date(now - 2 * 864e5).toISOString(),
      compoundedAt: new Date(now - 2 * 864e5 + 36e5).toISOString(),
      compoundedBy: "Jordan Hale, RPh",
      verifiedBy: "Jordan Hale, RPh",
      ingredientsUsed: [
        { ingredientId: "ketoprofen", lotId: "lot-keto-a", formulaQty: 6, weighedQty: 6.03, unit: "g", potencyPct: 99.5 },
        { ingredientId: "parabens", lotId: "lot-parab-a", formulaQty: 0.12, weighedQty: 0.12, unit: "g", potencyPct: 100 },
        { ingredientId: "versabase", lotId: "lot-vb-a", formulaQty: 53.88, weighedQty: 53.88, unit: "g", potencyPct: 100 },
      ],
      budDate: new Date(now - 2 * 864e5 + 45 * 864e5).toISOString(),
      budHours: 45 * 24,
      budBasis: "In-house stability study: 45 days (shorter than chapter default)",
      budStorage: "CRT",
      budCappedBy: "stability",
      labelPrinted: true,
      labelText: "IsoEase Ketoprofen Cream 10%\nPatient: Lee Park\nBatch CR-20260824-7721\nBUD pending pickup · store CRT\nFor external use only · Avoid broken skin\nUSP <795>  60 g ointment jar",
      notes: "",
      hd: false,
    },
  ];
}

export function lotAlerts(lots: InventoryLot[]) {
  const now = Date.now();
  return lots.map((lot) => {
    const ms = new Date(lot.expiresAt).getTime() - now;
    const expired = ms < 0;
    const expiringSoon = !expired && ms < 30 * 864e5;
    return { lot, expired, expiringSoon };
  });
}

/** Operations LIMS / MOM types. Never expose these through the provider portal. */

export type UspChapter = "795" | "797";
export type NioshTable = 1 | 2 | 3;
export type ControlledSchedule = "II" | "III" | "IV" | "V";
export type IngredientRole = "API" | "base" | "excipient";
export type BudVehicle =
  | "aqueous-unpreserved"
  | "aqueous-preserved"
  | "nonaqueous-liquid"
  | "nonaqueous-solid";
export type SterileCategory = 1 | 2 | 3;
export type StorageCondition = "CRT" | "refrigerated" | "frozen";
export type IsoClass = "ISO 5" | "ISO 7" | "ISO 8" | "unclassified";
export type CrStage = "intake" | "formula" | "compounding" | "labeling" | "dispense" | "shipped";
export type EquipmentKind = "balance" | "hood" | "fridge" | "incubator" | "room";

export type Ingredient = {
  id: string;
  name: string;
  cas: string;
  nioshTable: NioshTable | null;
  hazardous: boolean;
  controlledSchedule: ControlledSchedule | null;
  defaultPotencyPct: number;
  unit: string;
};

export type InventoryLot = {
  id: string;
  ingredientId: string;
  lotNumber: string;
  supplier: string;
  receivedAt: string;
  expiresAt: string;
  quantity: number;
  remaining: number;
  unit: string;
  potencyPct: number;
  coaName: string;
  quarantine: boolean;
};

export type MfrLine = {
  ingredientId: string;
  quantity: number;
  unit: string;
  role: IngredientRole;
};

export type MasterFormulationRecord = {
  id: string;
  productId: string;
  doseId: string;
  title: string;
  uspChapter: UspChapter;
  vehicle: BudVehicle;
  sterileCategory?: SterileCategory;
  startingComponentsSterile?: boolean;
  preserved: boolean;
  refrigerated: boolean;
  dosageForm: string;
  strength: string;
  batchSize: number;
  batchUnit: string;
  ingredients: MfrLine[];
  procedure: string[];
  qualityChecks: string[];
  container: string;
  storage: string;
  labeling: string[];
  hdPrecautions: string;
  /** Optional stability study; caps BUD when shorter than the chapter default. */
  stabilityDays: number | null;
};

export type CrIngredientUse = {
  ingredientId: string;
  lotId: string;
  formulaQty: number;
  weighedQty: number;
  unit: string;
  potencyPct: number;
};

export type CompoundingRecord = {
  id: string;
  mfrId: string;
  orderId: string;
  itemIndex: number;
  productName: string;
  doseLabel: string;
  patientName: string;
  batchLot: string;
  stage: CrStage;
  createdAt: string;
  compoundedAt?: string;
  compoundedBy: string;
  verifiedBy: string;
  ingredientsUsed: CrIngredientUse[];
  budDate: string;
  budHours: number;
  budBasis: string;
  budStorage: StorageCondition;
  budCappedBy: "chapter" | "stability" | "ingredient";
  labelPrinted: boolean;
  labelText: string;
  notes: string;
  hd: boolean;
};

export type EnvironmentLog = {
  id: string;
  area: string;
  isoClass: IsoClass;
  temperatureC: number;
  humidityPct: number;
  recordedAt: string;
  recordedBy: string;
  inSpec: boolean;
  note: string;
};

export type EquipmentLog = {
  id: string;
  equipmentId: string;
  equipmentName: string;
  kind: EquipmentKind;
  reading: string;
  recordedAt: string;
  recordedBy: string;
  inSpec: boolean;
};

export type ControlledSubstanceLog = {
  id: string;
  at: string;
  ingredientId: string;
  lotId: string;
  crId: string;
  quantity: number;
  unit: string;
  remaining: number;
  pharmacist: string;
};

export type BudInput = {
  chapter: UspChapter;
  compoundedAt: string;
  vehicle?: BudVehicle;
  refrigerated?: boolean;
  frozen?: boolean;
  sterileCategory?: SterileCategory;
  startingComponentsSterile?: boolean;
  sterilityTested?: boolean;
  ingredientExpires?: string[];
  stabilityDays?: number | null;
};

export type BudResult = {
  hours: number;
  date: string;
  storage: StorageCondition;
  basis: string;
  cappedBy: "chapter" | "stability" | "ingredient";
  chapter: UspChapter;
};

export const CR_STAGES: CrStage[] = [
  "intake",
  "formula",
  "compounding",
  "labeling",
  "dispense",
  "shipped",
];

export const CR_STAGE_LABEL: Record<CrStage, string> = {
  intake: "Order intake",
  formula: "Formula / recipe",
  compounding: "Batch production",
  labeling: "Labeling",
  dispense: "Dispensing",
  shipped: "Shipping",
};

import type {
  ControlledSubstanceLog,
  EnvironmentLog,
  EquipmentLog,
  Ingredient,
  InventoryLot,
  MasterFormulationRecord,
} from "./lims-types";

export const INGREDIENTS: Ingredient[] = [
  { id: "estradiol", name: "Estradiol USP", cas: "50-28-2", nioshTable: 2, hazardous: true, controlledSchedule: null, defaultPotencyPct: 99.2, unit: "g" },
  { id: "progesterone", name: "Progesterone USP micronized", cas: "57-83-0", nioshTable: 2, hazardous: true, controlledSchedule: null, defaultPotencyPct: 99.4, unit: "g" },
  { id: "testosterone", name: "Testosterone USP", cas: "58-22-0", nioshTable: 2, hazardous: true, controlledSchedule: "III", defaultPotencyPct: 98.8, unit: "g" },
  { id: "tretinoin", name: "Tretinoin USP", cas: "302-79-4", nioshTable: 3, hazardous: true, controlledSchedule: null, defaultPotencyPct: 99.1, unit: "g" },
  { id: "dhea", name: "DHEA USP", cas: "53-43-0", nioshTable: 2, hazardous: true, controlledSchedule: null, defaultPotencyPct: 99.0, unit: "g" },
  { id: "pregnenolone", name: "Pregnenolone USP", cas: "145-13-1", nioshTable: 2, hazardous: true, controlledSchedule: null, defaultPotencyPct: 99.3, unit: "g" },
  { id: "naltrexone", name: "Naltrexone HCl USP", cas: "16676-29-2", nioshTable: null, hazardous: false, controlledSchedule: null, defaultPotencyPct: 99.6, unit: "g" },
  { id: "ketoprofen", name: "Ketoprofen USP", cas: "22071-15-4", nioshTable: null, hazardous: false, controlledSchedule: null, defaultPotencyPct: 99.5, unit: "g" },
  { id: "gabapentin", name: "Gabapentin USP", cas: "60142-96-3", nioshTable: null, hazardous: false, controlledSchedule: null, defaultPotencyPct: 99.7, unit: "g" },
  { id: "diclofenac", name: "Diclofenac sodium USP", cas: "15307-79-6", nioshTable: null, hazardous: false, controlledSchedule: null, defaultPotencyPct: 99.4, unit: "g" },
  { id: "hydroquinone", name: "Hydroquinone USP", cas: "123-31-9", nioshTable: null, hazardous: false, controlledSchedule: null, defaultPotencyPct: 99.0, unit: "g" },
  { id: "minoxidil", name: "Minoxidil USP", cas: "38304-91-5", nioshTable: null, hazardous: false, controlledSchedule: null, defaultPotencyPct: 99.2, unit: "g" },
  { id: "omeprazole", name: "Omeprazole USP", cas: "73590-58-6", nioshTable: null, hazardous: false, controlledSchedule: null, defaultPotencyPct: 99.1, unit: "g" },
  { id: "levothyroxine", name: "Levothyroxine sodium USP", cas: "55-03-8", nioshTable: null, hazardous: false, controlledSchedule: null, defaultPotencyPct: 99.8, unit: "g" },
  { id: "liothyronine", name: "Liothyronine sodium USP", cas: "55-06-1", nioshTable: null, hazardous: false, controlledSchedule: null, defaultPotencyPct: 99.7, unit: "g" },
  { id: "sildenafil", name: "Sildenafil citrate USP", cas: "171599-83-0", nioshTable: null, hazardous: false, controlledSchedule: null, defaultPotencyPct: 99.3, unit: "g" },
  { id: "melatonin", name: "Melatonin USP", cas: "73-31-4", nioshTable: null, hazardous: false, controlledSchedule: null, defaultPotencyPct: 99.0, unit: "g" },
  { id: "glutathione", name: "Glutathione reduced USP", cas: "70-18-8", nioshTable: null, hazardous: false, controlledSchedule: null, defaultPotencyPct: 98.5, unit: "g" },
  { id: "nad", name: "NAD+ (β-nicotinamide adenine dinucleotide)", cas: "53-84-9", nioshTable: null, hazardous: false, controlledSchedule: null, defaultPotencyPct: 98.0, unit: "g" },
  { id: "versabase", name: "VersaBase cream", cas: "", nioshTable: null, hazardous: false, controlledSchedule: null, defaultPotencyPct: 100, unit: "g" },
  { id: "hydrogel", name: "Alcohol hydrogel base", cas: "", nioshTable: null, hazardous: false, controlledSchedule: null, defaultPotencyPct: 100, unit: "g" },
  { id: "oil-cap", name: "Sunflower oil capsule fill", cas: "", nioshTable: null, hazardous: false, controlledSchedule: null, defaultPotencyPct: 100, unit: "mL" },
  { id: "avicel", name: "Microcrystalline cellulose", cas: "9004-34-6", nioshTable: null, hazardous: false, controlledSchedule: null, defaultPotencyPct: 100, unit: "g" },
  { id: "parabens", name: "Methylparaben / propylparaben blend", cas: "", nioshTable: null, hazardous: false, controlledSchedule: null, defaultPotencyPct: 100, unit: "g" },
  { id: "ns-water", name: "Sterile water for irrigation", cas: "7732-18-5", nioshTable: null, hazardous: false, controlledSchedule: null, defaultPotencyPct: 100, unit: "mL" },
  { id: "nasal-vehicle", name: "Isotonic nasal vehicle", cas: "", nioshTable: null, hazardous: false, controlledSchedule: null, defaultPotencyPct: 100, unit: "mL" },
];

function daysFromNow(days: number) {
  return new Date(Date.now() + days * 864e5).toISOString();
}

export function seedLots(): InventoryLot[] {
  return [
    { id: "lot-e2-a", ingredientId: "estradiol", lotNumber: "E2-24091", supplier: "PCCA", receivedAt: daysFromNow(-40), expiresAt: daysFromNow(280), quantity: 50, remaining: 41.2, unit: "g", potencyPct: 99.2, coaName: "COA-E2-24091.pdf", quarantine: false },
    { id: "lot-p4-a", ingredientId: "progesterone", lotNumber: "P4-24112", supplier: "Medisca", receivedAt: daysFromNow(-20), expiresAt: daysFromNow(310), quantity: 100, remaining: 86, unit: "g", potencyPct: 99.4, coaName: "COA-P4-24112.pdf", quarantine: false },
    { id: "lot-t-a", ingredientId: "testosterone", lotNumber: "TES-CIII-8831", supplier: "Letco", receivedAt: daysFromNow(-12), expiresAt: daysFromNow(200), quantity: 25, remaining: 18.4, unit: "g", potencyPct: 98.8, coaName: "COA-TES-8831.pdf", quarantine: false },
    { id: "lot-ldn-a", ingredientId: "naltrexone", lotNumber: "NTX-25014", supplier: "Letco", receivedAt: daysFromNow(-8), expiresAt: daysFromNow(400), quantity: 25, remaining: 22.1, unit: "g", potencyPct: 99.6, coaName: "COA-NTX-25014.pdf", quarantine: false },
    { id: "lot-keto-a", ingredientId: "ketoprofen", lotNumber: "KETO-23990", supplier: "PCCA", receivedAt: daysFromNow(-90), expiresAt: daysFromNow(18), quantity: 200, remaining: 144, unit: "g", potencyPct: 99.5, coaName: "COA-KETO-23990.pdf", quarantine: false },
    { id: "lot-keto-exp", ingredientId: "ketoprofen", lotNumber: "KETO-22101", supplier: "PCCA", receivedAt: daysFromNow(-400), expiresAt: daysFromNow(-12), quantity: 50, remaining: 6, unit: "g", potencyPct: 99.1, coaName: "COA-KETO-22101.pdf", quarantine: true },
    { id: "lot-vb-a", ingredientId: "versabase", lotNumber: "VB-25002", supplier: "PCCA", receivedAt: daysFromNow(-15), expiresAt: daysFromNow(500), quantity: 2000, remaining: 1640, unit: "g", potencyPct: 100, coaName: "COA-VB-25002.pdf", quarantine: false },
    { id: "lot-avicel-a", ingredientId: "avicel", lotNumber: "MCC-24880", supplier: "Spectrum", receivedAt: daysFromNow(-60), expiresAt: daysFromNow(600), quantity: 1000, remaining: 820, unit: "g", potencyPct: 100, coaName: "COA-MCC-24880.pdf", quarantine: false },
    { id: "lot-oil-a", ingredientId: "oil-cap", lotNumber: "SO-25008", supplier: "Medisca", receivedAt: daysFromNow(-10), expiresAt: daysFromNow(220), quantity: 2000, remaining: 1710, unit: "mL", potencyPct: 100, coaName: "COA-SO-25008.pdf", quarantine: false },
    { id: "lot-parab-a", ingredientId: "parabens", lotNumber: "PB-24101", supplier: "Letco", receivedAt: daysFromNow(-30), expiresAt: daysFromNow(340), quantity: 100, remaining: 91, unit: "g", potencyPct: 100, coaName: "COA-PB-24101.pdf", quarantine: false },
    { id: "lot-nad-a", ingredientId: "nad", lotNumber: "NAD-25021", supplier: "Fagron", receivedAt: daysFromNow(-5), expiresAt: daysFromNow(90), quantity: 10, remaining: 8.2, unit: "g", potencyPct: 98.0, coaName: "COA-NAD-25021.pdf", quarantine: false },
    { id: "lot-nsw-a", ingredientId: "ns-water", lotNumber: "SW-26011", supplier: "Hospira", receivedAt: daysFromNow(-3), expiresAt: daysFromNow(700), quantity: 4000, remaining: 3500, unit: "mL", potencyPct: 100, coaName: "COA-SW-26011.pdf", quarantine: false },
    { id: "lot-nasal-a", ingredientId: "nasal-vehicle", lotNumber: "NV-25004", supplier: "PCCA", receivedAt: daysFromNow(-14), expiresAt: daysFromNow(180), quantity: 1000, remaining: 860, unit: "mL", potencyPct: 100, coaName: "COA-NV-25004.pdf", quarantine: false },
    { id: "lot-tret-a", ingredientId: "tretinoin", lotNumber: "TRET-24177", supplier: "Medisca", receivedAt: daysFromNow(-25), expiresAt: daysFromNow(150), quantity: 10, remaining: 7.4, unit: "g", potencyPct: 99.1, coaName: "COA-TRET-24177.pdf", quarantine: false },
  ];
}

export const MFRS: MasterFormulationRecord[] = [
  {
    id: "mfr-e2-05",
    productId: "estradiol-cream",
    doseId: "e2-05",
    title: "Estradiol 0.5 mg/g cream — MFR-795-014",
    uspChapter: "795",
    vehicle: "aqueous-preserved",
    preserved: true,
    refrigerated: false,
    dosageForm: "Cream",
    strength: "0.5 mg/g",
    batchSize: 30,
    batchUnit: "g",
    ingredients: [
      { ingredientId: "estradiol", quantity: 0.015, unit: "g", role: "API" },
      { ingredientId: "parabens", quantity: 0.06, unit: "g", role: "excipient" },
      { ingredientId: "versabase", quantity: 29.925, unit: "g", role: "base" },
    ],
    procedure: [
      "Don PPE per USP <800> (NIOSH Table 2 hormone). Compound in C-PEC.",
      "Weigh estradiol, adjusting for lot potency.",
      "Levigate API with a portion of VersaBase.",
      "Incorporate remaining base and paraben blend geometrically.",
      "QS to 30 g. Mix until uniform. Transfer to ointment jar.",
    ],
    qualityChecks: ["Appearance: white to off-white cream", "Weight ±2%", "No visible grit"],
    container: "30 g light-resistant ointment jar",
    storage: "Controlled room temperature 20–25 °C",
    labeling: ["For external use only", "Hazardous drug — USP <800>", "BUD and storage on finished label"],
    hdPrecautions: "NIOSH Table 2. Compound in C-PEC. Double gloves, gown, eye protection.",
    stabilityDays: null,
  },
  {
    id: "mfr-p4-100",
    productId: "progesterone-caps",
    doseId: "p4-100",
    title: "Progesterone 100 mg capsules — MFR-795-022",
    uspChapter: "795",
    vehicle: "nonaqueous-solid",
    preserved: false,
    refrigerated: false,
    dosageForm: "Capsule",
    strength: "100 mg",
    batchSize: 30,
    batchUnit: "caps",
    ingredients: [
      { ingredientId: "progesterone", quantity: 3.0, unit: "g", role: "API" },
      { ingredientId: "oil-cap", quantity: 15, unit: "mL", role: "base" },
    ],
    procedure: [
      "USP <800> C-PEC for NIOSH Table 2 hormone.",
      "Weigh micronized progesterone, potency-adjust.",
      "Suspend in sunflower oil. Fill size 1 capsules. QS 30 capsules.",
    ],
    qualityChecks: ["Fill weight ±5%", "Capsule integrity"],
    container: "30-count amber vial",
    storage: "CRT 20–25 °C. Protect from light.",
    labeling: ["Take at bedtime unless otherwise directed", "Hazardous drug — USP <800>"],
    hdPrecautions: "NIOSH Table 2. C-PEC, PPE.",
    stabilityDays: 90,
  },
  {
    id: "mfr-ldn-45",
    productId: "ldn-caps",
    doseId: "ldn-45",
    title: "Naltrexone HCl 4.5 mg capsules — MFR-795-031",
    uspChapter: "795",
    vehicle: "nonaqueous-solid",
    preserved: false,
    refrigerated: false,
    dosageForm: "Capsule",
    strength: "4.5 mg",
    batchSize: 30,
    batchUnit: "caps",
    ingredients: [
      { ingredientId: "naltrexone", quantity: 0.135, unit: "g", role: "API" },
      { ingredientId: "avicel", quantity: 6.0, unit: "g", role: "excipient" },
    ],
    procedure: [
      "Triturate naltrexone with MCC geometrically.",
      "Fill size 3 capsules. QS 30.",
    ],
    qualityChecks: ["Content uniformity by weight", "No dye"],
    container: "30-count vial",
    storage: "CRT",
    labeling: ["Low-dose naltrexone", "Take as directed"],
    hdPrecautions: "",
    stabilityDays: null,
  },
  {
    id: "mfr-keto-10",
    productId: "ketoprofen-cream",
    doseId: "keto-10",
    title: "Ketoprofen 10% cream — MFR-795-044",
    uspChapter: "795",
    vehicle: "aqueous-preserved",
    preserved: true,
    refrigerated: false,
    dosageForm: "Cream",
    strength: "10%",
    batchSize: 60,
    batchUnit: "g",
    ingredients: [
      { ingredientId: "ketoprofen", quantity: 6.0, unit: "g", role: "API" },
      { ingredientId: "parabens", quantity: 0.12, unit: "g", role: "excipient" },
      { ingredientId: "versabase", quantity: 53.88, unit: "g", role: "base" },
    ],
    procedure: [
      "Levigate ketoprofen into VersaBase.",
      "Add paraben blend. QS 60 g.",
    ],
    qualityChecks: ["White cream, no grit", "Weight ±2%"],
    container: "60 g ointment jar",
    storage: "CRT",
    labeling: ["For external use only", "Avoid broken skin"],
    hdPrecautions: "",
    stabilityDays: 45,
  },
  {
    id: "mfr-t-20",
    productId: "testosterone-gel",
    doseId: "t-20",
    title: "Testosterone 20 mg/mL gel — MFR-795-018",
    uspChapter: "795",
    vehicle: "aqueous-unpreserved",
    preserved: false,
    refrigerated: true,
    dosageForm: "Gel",
    strength: "20 mg/mL",
    batchSize: 30,
    batchUnit: "mL",
    ingredients: [
      { ingredientId: "testosterone", quantity: 0.6, unit: "g", role: "API" },
      { ingredientId: "hydrogel", quantity: 29.4, unit: "g", role: "base" },
    ],
    procedure: [
      "C-III controlled substance. Two-person count-in from vault.",
      "USP <800> C-PEC. Potency-adjust testosterone.",
      "Dissolve/suspend in hydrogel. QS 30 mL.",
    ],
    qualityChecks: ["Clear gel", "DEA 222 / CSOS log complete"],
    container: "30 mL metered pump",
    storage: "Refrigerate 2–8 °C (unpreserved aqueous)",
    labeling: ["C-III", "Hazardous drug — USP <800>", "Keep out of reach of children"],
    hdPrecautions: "NIOSH Table 2 + schedule III. C-PEC, PPE, CS vault.",
    stabilityDays: null,
  },
  {
    id: "mfr-nad-50",
    productId: "nad-spray",
    doseId: "nad-50",
    title: "NAD+ 50 mg/mL nasal spray — MFR-797-003",
    uspChapter: "797",
    vehicle: "aqueous-unpreserved",
    sterileCategory: 1,
    startingComponentsSterile: false,
    preserved: false,
    refrigerated: true,
    dosageForm: "Nasal spray",
    strength: "50 mg/mL",
    batchSize: 15,
    batchUnit: "mL",
    ingredients: [
      { ingredientId: "nad", quantity: 0.75, unit: "g", role: "API" },
      { ingredientId: "nasal-vehicle", quantity: 10, unit: "mL", role: "base" },
      { ingredientId: "ns-water", quantity: 4.25, unit: "mL", role: "excipient" },
    ],
    procedure: [
      "Compound in ISO 5 PEC inside ISO 7 buffer. Category 1 CSP.",
      "Dissolve NAD+ in nasal vehicle. QS with sterile water. Filter 0.22 µm into spray bottle.",
    ],
    qualityChecks: ["ISO 5 particle counts in spec", "Filter integrity", "Clear colorless solution"],
    container: "15 mL nasal spray",
    storage: "Refrigerate. Category 1 BUD.",
    labeling: ["For nasal use", "Refrigerate", "Discard after BUD"],
    hdPrecautions: "",
    stabilityDays: null,
  },
];

export function seedEnvironmentLogs(): EnvironmentLog[] {
  const by = "Jordan Hale, RPh";
  return [
    { id: "env-1", area: "Nonsterile suite", isoClass: "unclassified", temperatureC: 21.4, humidityPct: 44, recordedAt: new Date(Date.now() - 2 * 36e5).toISOString(), recordedBy: by, inSpec: true, note: "20–25 °C / 30–60% RH" },
    { id: "env-2", area: "HD C-PEC room", isoClass: "unclassified", temperatureC: 22.1, humidityPct: 41, recordedAt: new Date(Date.now() - 2 * 36e5).toISOString(), recordedBy: by, inSpec: true, note: "Negative pressure confirmed" },
    { id: "env-3", area: "ISO 7 buffer", isoClass: "ISO 7", temperatureC: 20.8, humidityPct: 48, recordedAt: new Date(Date.now() - 90 * 60e3).toISOString(), recordedBy: by, inSpec: true, note: "Dynamic particle count in spec" },
    { id: "env-4", area: "ISO 5 PEC", isoClass: "ISO 5", temperatureC: 20.6, humidityPct: 47, recordedAt: new Date(Date.now() - 90 * 60e3).toISOString(), recordedBy: by, inSpec: true, note: "Prefilter differential OK" },
    { id: "env-5", area: "Controlled-substance fridge", isoClass: "unclassified", temperatureC: 4.2, humidityPct: 38, recordedAt: new Date(Date.now() - 30 * 60e3).toISOString(), recordedBy: by, inSpec: true, note: "2–8 °C" },
  ];
}

export function seedEquipmentLogs(): EquipmentLog[] {
  const by = "Jordan Hale, RPh";
  return [
    { id: "eq-1", equipmentId: "bal-01", equipmentName: "Mettler XPR analytical balance", kind: "balance", reading: "Internal cal pass · 100 g check 100.0002 g", recordedAt: new Date(Date.now() - 864e5).toISOString(), recordedBy: by, inSpec: true },
    { id: "eq-2", equipmentId: "cpec-01", equipmentName: "Containment ventilated enclosure (C-PEC)", kind: "hood", reading: "Face velocity 100 fpm", recordedAt: new Date(Date.now() - 2 * 864e5).toISOString(), recordedBy: by, inSpec: true },
    { id: "eq-3", equipmentId: "pec-01", equipmentName: "ISO 5 LAFW", kind: "hood", reading: "Smoke study current; prefilter ΔP 0.4 in. w.g.", recordedAt: new Date(Date.now() - 864e5).toISOString(), recordedBy: by, inSpec: true },
    { id: "eq-4", equipmentId: "fr-cs", equipmentName: "CS refrigerator", kind: "fridge", reading: "4.2 °C", recordedAt: new Date(Date.now() - 30 * 60e3).toISOString(), recordedBy: by, inSpec: true },
  ];
}

export function seedCsLogs(): ControlledSubstanceLog[] {
  return [
    {
      id: "cs-1",
      at: new Date(Date.now() - 5 * 864e5).toISOString(),
      ingredientId: "testosterone",
      lotId: "lot-t-a",
      crId: "seed",
      quantity: 0.6,
      unit: "g",
      remaining: 18.4,
      pharmacist: "Jordan Hale, RPh",
    },
  ];
}

export function findMfr(productId: string, doseId: string, mfrs: MasterFormulationRecord[] = MFRS) {
  return mfrs.find((m) => m.productId === productId && m.doseId === doseId) || mfrs.find((m) => m.productId === productId);
}

export function getIngredient(id: string, list: Ingredient[] = INGREDIENTS) {
  return list.find((item) => item.id === id);
}

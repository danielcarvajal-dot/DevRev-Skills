import type { Product, WorkflowKind } from "./types";

export type RxField =
  | "strength"
  | "dosageForm"
  | "quantity"
  | "directions"
  | "refills"
  | "daw"
  | "doseAmount"
  | "volume"
  | "notes";

export type OrderableMeta = {
  family: string;
  familySlug: string;
  workflowKind: WorkflowKind;
  searchTerms: string[];
  startingDoseMg?: number;
  requireWeight: boolean;
  allergyTags: string[];
  defaultDirections: string;
  quantityUnit: string;
  defaultQuantity: number;
};

export type OrderableFamily = {
  slug: string;
  name: string;
  forms: string[];
  products: Product[];
  searchBlob: string;
};

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "family";
}

function inferFamily(product: Product) {
  return (
    product.family ||
    product.shortName
      .replace(/\s+(Cream|Gel|Capsules?|Troches?|Suspension|Nasal spray|Topical|Compound|Spray|Injection|Suppositor(?:y|ies))$/i, "")
      .trim() ||
    product.shortName
  );
}

function inferWorkflow(form: string): WorkflowKind {
  const value = form.toLowerCase();
  if (value.includes("inject")) return "injection";
  if (value.includes("suppositor")) return "suppository";
  if (value.includes("capsule")) return "capsule";
  if (value.includes("cream")) return "cream";
  if (value.includes("gel")) return "gel";
  if (value.includes("troche")) return "troche";
  if (value.includes("suspension")) return "suspension";
  if (value.includes("spray")) return "spray";
  return "topical";
}

function inferQuantityUnit(kind: WorkflowKind) {
  if (kind === "capsule") return "capsules";
  if (kind === "troche") return "troches";
  if (kind === "injection") return "mL";
  if (kind === "suppository") return "suppositories";
  if (kind === "suspension" || kind === "spray") return "mL";
  return "grams";
}

const OVERRIDES: Record<string, Partial<OrderableMeta>> = {
  "progesterone-caps": {
    family: "Progesterone",
    startingDoseMg: 100,
    defaultDirections: "Take 1 capsule by mouth at bedtime",
    quantityUnit: "capsules",
    defaultQuantity: 30,
    allergyTags: ["progesterone"],
    searchTerms: ["progesterone", "p4", "capsule", "micronized"],
  },
  "progesterone-cream": {
    family: "Progesterone",
    startingDoseMg: 20,
    defaultDirections: "Apply the measured amount to clean, dry skin once daily",
    quantityUnit: "grams",
    defaultQuantity: 30,
    allergyTags: ["progesterone"],
    searchTerms: ["progesterone", "p4", "cream", "topical"],
  },
  "progesterone-supp": {
    family: "Progesterone",
    startingDoseMg: 100,
    defaultDirections: "Insert 1 suppository vaginally at bedtime",
    quantityUnit: "suppositories",
    defaultQuantity: 30,
    allergyTags: ["progesterone"],
    searchTerms: ["progesterone", "p4", "suppository", "vaginal"],
  },
  "semaglutide-injection": {
    family: "Semaglutide",
    workflowKind: "injection",
    requireWeight: true,
    startingDoseMg: 0.25,
    defaultDirections: "Inject the prescribed dose subcutaneously once weekly",
    quantityUnit: "mL",
    defaultQuantity: 2,
    allergyTags: ["semaglutide", "cyanocobalamin", "b12"],
    searchTerms: ["semaglutide", "glp-1", "b12", "cyanocobalamin", "injection", "compounded"],
  },
  "semaglutide-troche": {
    family: "Semaglutide",
    startingDoseMg: 0.25,
    defaultDirections: "Place 1 troche between cheek and gum once daily",
    quantityUnit: "troches",
    defaultQuantity: 30,
    allergyTags: ["semaglutide"],
    searchTerms: ["semaglutide", "glp-1", "troche", "oral"],
  },
  "semaglutide-capsule": {
    family: "Semaglutide",
    startingDoseMg: 0.25,
    defaultDirections: "Take 1 capsule by mouth once daily",
    quantityUnit: "capsules",
    defaultQuantity: 30,
    allergyTags: ["semaglutide"],
    searchTerms: ["semaglutide", "glp-1", "capsule", "oral"],
  },
  "estradiol-cream": {
    family: "Estradiol",
    allergyTags: ["estradiol", "estrogen"],
    searchTerms: ["estradiol", "e2", "estrogen", "cream"],
  },
  "ldn-caps": {
    family: "Low-Dose Naltrexone",
    startingDoseMg: 1.5,
    allergyTags: ["naltrexone"],
    defaultDirections: "Take 1 capsule by mouth at bedtime",
  },
};

export function orderableMeta(product: Product): OrderableMeta {
  const override = OVERRIDES[product.id] || {};
  const family = override.family || inferFamily(product);
  const workflowKind = override.workflowKind || product.workflowKind || inferWorkflow(String(product.form));
  return {
    family,
    familySlug: product.familySlug || slugify(family),
    workflowKind,
    searchTerms: [
      ...new Set([
        ...(override.searchTerms || []),
        ...(product.searchTerms || []),
        ...product.tags,
        family,
        String(product.form),
        product.shortName,
      ]),
    ],
    startingDoseMg: override.startingDoseMg ?? product.startingDoseMg,
    requireWeight: override.requireWeight ?? product.requireWeight ?? workflowKind === "injection",
    allergyTags: override.allergyTags || product.allergyTags || [family.toLowerCase()],
    defaultDirections: override.defaultDirections || product.defaultDirections || product.howToUse || "",
    quantityUnit: override.quantityUnit || product.quantityUnit || inferQuantityUnit(workflowKind),
    defaultQuantity: override.defaultQuantity ?? product.defaultQuantity ?? (workflowKind === "injection" ? 2 : 30),
  };
}

export function fieldsForWorkflow(kind: WorkflowKind): RxField[] {
  const shared: RxField[] = ["strength", "dosageForm", "quantity", "directions", "refills", "daw", "notes"];
  if (kind === "injection") {
    return ["strength", "dosageForm", "doseAmount", "volume", "quantity", "directions", "refills", "daw", "notes"];
  }
  return shared;
}

export function familiesFrom(products: Product[]): OrderableFamily[] {
  const grouped = new Map<string, Product[]>();
  for (const product of products) {
    const meta = orderableMeta(product);
    const list = grouped.get(meta.familySlug) ?? [];
    list.push(product);
    grouped.set(meta.familySlug, list);
  }
  return [...grouped.entries()].map(([slug, items]) => {
    const meta = orderableMeta(items[0]!);
    const searchBlob = [
      meta.family,
      ...items.map((item) => `${item.name} ${item.shortName} ${item.summary} ${item.form} ${item.tags.join(" ")} ${orderableMeta(item).searchTerms.join(" ")}`),
    ]
      .join(" ")
      .toLowerCase();
    return {
      slug,
      name: meta.family,
      forms: [...new Set(items.map((item) => String(item.form)))],
      products: items,
      searchBlob,
    };
  });
}

export function searchOrderables(products: Product[], query: string) {
  const q = query.trim().toLowerCase();
  const families = familiesFrom(products);
  if (!q) return families;
  return families.filter((family) => family.searchBlob.includes(q) || family.name.toLowerCase().includes(q));
}

export function parseMg(value: string): number | null {
  const match = String(value || "").replace(/,/g, "").match(/([\d.]+)\s*(mg)?/i);
  if (!match) return null;
  const amount = Number(match[1]);
  return Number.isFinite(amount) ? amount : null;
}

import { CATEGORIES, normalizeCategory } from "./products";
import { orderableMeta } from "./orderables";
import type { Category, Product } from "./types";

export type FormulaIngredient = {
  name: string;
  role: "API" | "base" | "excipient";
};

export type FormulaStrength = {
  doseId: string;
  label: string;
};

export type Formula = {
  productId: string;
  category: Category;
  medication: string;
  formulation: string;
  dosageForm: string;
  route: string;
  strengths: FormulaStrength[];
  ingredients: FormulaIngredient[];
};

type FormulaMeta = {
  formulation: string;
  route: string;
  ingredients: FormulaIngredient[];
};

const FORMULA_META: Record<string, FormulaMeta> = {
  "estradiol-cream": {
    formulation: "Estradiol Cream",
    route: "Transdermal",
    ingredients: [
      { name: "Estradiol USP", role: "API" },
      { name: "VersaBase cream", role: "base" },
      { name: "Methylparaben / propylparaben blend", role: "excipient" },
    ],
  },
  "progesterone-caps": {
    formulation: "Micronized Progesterone Capsules",
    route: "Oral",
    ingredients: [
      { name: "Progesterone USP micronized", role: "API" },
      { name: "Sunflower oil capsule fill", role: "base" },
    ],
  },
  "progesterone-cream": {
    formulation: "Progesterone Cream",
    route: "Transdermal",
    ingredients: [
      { name: "Progesterone USP micronized", role: "API" },
      { name: "VersaBase cream", role: "base" },
    ],
  },
  "progesterone-supp": {
    formulation: "Progesterone Suppositories",
    route: "Vaginal",
    ingredients: [
      { name: "Progesterone USP micronized", role: "API" },
      { name: "Fatty acid suppository base", role: "base" },
    ],
  },
  "testosterone-gel": {
    formulation: "Testosterone Gel",
    route: "Transdermal",
    ingredients: [
      { name: "Testosterone USP", role: "API" },
      { name: "Alcohol hydrogel base", role: "base" },
    ],
  },
  "testosterone-cypionate": {
    formulation: "Testosterone Cypionate",
    route: "IM",
    ingredients: [
      { name: "Testosterone Cypionate USP", role: "API" },
      { name: "Cottonseed oil", role: "base" },
      { name: "Benzyl alcohol", role: "excipient" },
    ],
  },
  "thyroid-combo": {
    formulation: "T3/T4 Combination Capsules",
    route: "Oral",
    ingredients: [
      { name: "Liothyronine sodium USP", role: "API" },
      { name: "Levothyroxine sodium USP", role: "API" },
      { name: "Microcrystalline cellulose", role: "excipient" },
    ],
  },
  "melatonin-troche": {
    formulation: "Melatonin Troches",
    route: "Buccal",
    ingredients: [
      { name: "Melatonin USP", role: "API" },
      { name: "Polyethylene glycol troche base", role: "base" },
    ],
  },
  "dhea-caps": {
    formulation: "DHEA Capsules",
    route: "Oral",
    ingredients: [
      { name: "DHEA USP", role: "API" },
      { name: "Microcrystalline cellulose", role: "excipient" },
    ],
  },
  pregnenolone: {
    formulation: "Pregnenolone Capsules",
    route: "Oral",
    ingredients: [
      { name: "Pregnenolone USP", role: "API" },
      { name: "Microcrystalline cellulose", role: "excipient" },
    ],
  },
  "ketoprofen-cream": {
    formulation: "Ketoprofen Cream",
    route: "Topical",
    ingredients: [
      { name: "Ketoprofen USP", role: "API" },
      { name: "VersaBase cream", role: "base" },
      { name: "Methylparaben / propylparaben blend", role: "excipient" },
    ],
  },
  "gabapentin-topical": {
    formulation: "Gabapentin Topical",
    route: "Topical",
    ingredients: [
      { name: "Gabapentin USP", role: "API" },
      { name: "PLO gel base", role: "base" },
    ],
  },
  "diclofenac-gel": {
    formulation: "Diclofenac Gel",
    route: "Topical",
    ingredients: [
      { name: "Diclofenac sodium USP", role: "API" },
      { name: "Alcohol hydrogel base", role: "base" },
    ],
  },
  "ldn-caps": {
    formulation: "Low-Dose Naltrexone Capsules",
    route: "Oral",
    ingredients: [
      { name: "Naltrexone HCl USP", role: "API" },
      { name: "Microcrystalline cellulose", role: "excipient" },
    ],
  },
  "omeprazole-susp": {
    formulation: "Pediatric Omeprazole Suspension",
    route: "Oral",
    ingredients: [
      { name: "Omeprazole USP", role: "API" },
      { name: "Alkalized suspending vehicle", role: "base" },
    ],
  },
  hydroquinone: {
    formulation: "Hydroquinone Cream",
    route: "Topical",
    ingredients: [
      { name: "Hydroquinone USP", role: "API" },
      { name: "VersaBase cream", role: "base" },
    ],
  },
  tretinoin: {
    formulation: "Tretinoin Cream",
    route: "Topical",
    ingredients: [
      { name: "Tretinoin USP", role: "API" },
      { name: "Ceramide cream base", role: "base" },
    ],
  },
  minoxidil: {
    formulation: "Minoxidil Compound",
    route: "Topical",
    ingredients: [
      { name: "Minoxidil USP", role: "API" },
      { name: "Hydroalcoholic scalp vehicle", role: "base" },
    ],
  },
  "sildenafil-troche": {
    formulation: "Sildenafil Troches",
    route: "Buccal",
    ingredients: [
      { name: "Sildenafil citrate USP", role: "API" },
      { name: "Polyethylene glycol troche base", role: "base" },
    ],
  },
  glutathione: {
    formulation: "Glutathione Capsules",
    route: "Oral",
    ingredients: [
      { name: "Glutathione reduced USP", role: "API" },
      { name: "Acid-resistant capsule shell", role: "excipient" },
    ],
  },
  "nad-spray": {
    formulation: "NAD+ Nasal Spray",
    route: "Intranasal",
    ingredients: [
      { name: "NAD+ (β-nicotinamide adenine dinucleotide)", role: "API" },
      { name: "Isotonic nasal vehicle", role: "base" },
      { name: "Sterile water for irrigation", role: "excipient" },
    ],
  },
  "semaglutide-injection": {
    formulation: "Semaglutide + B12 Injection",
    route: "Subcutaneous",
    ingredients: [
      { name: "Semaglutide", role: "API" },
      { name: "Cyanocobalamin (B12)", role: "API" },
      { name: "Bacteriostatic water", role: "base" },
    ],
  },
  "semaglutide-troche": {
    formulation: "Semaglutide Troches",
    route: "Buccal",
    ingredients: [
      { name: "Semaglutide", role: "API" },
      { name: "Polyethylene glycol troche base", role: "base" },
    ],
  },
  "semaglutide-capsule": {
    formulation: "Semaglutide Capsules",
    route: "Oral",
    ingredients: [
      { name: "Semaglutide", role: "API" },
      { name: "Microcrystalline cellulose", role: "excipient" },
    ],
  },
};

function inferRoute(form: string): string {
  const value = form.toLowerCase();
  if (value.includes("inject")) return "IM";
  if (value.includes("suppositor")) return "Vaginal";
  if (value.includes("spray") || value.includes("nasal")) return "Intranasal";
  if (value.includes("troche")) return "Buccal";
  if (value.includes("capsule") || value.includes("suspension")) return "Oral";
  if (value.includes("cream") || value.includes("gel")) return "Transdermal";
  return "Topical";
}

export function formulaForProduct(product: Product): Formula {
  const meta = orderableMeta(product);
  const extras = FORMULA_META[product.id];
  return {
    productId: product.id,
    category: normalizeCategory(product.category, product.id),
    medication: meta.family,
    formulation: extras?.formulation || product.shortName,
    dosageForm: String(product.form),
    route: extras?.route || inferRoute(String(product.form)),
    strengths: product.doses.map((dose) => ({ doseId: dose.id, label: dose.label })),
    ingredients: extras?.ingredients || [{ name: meta.family, role: "API" }],
  };
}

export function formulasFrom(products: Product[]): Formula[] {
  return products.map(formulaForProduct);
}

export function uniqueSorted(values: string[]) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

export function medicationsInCategory(formulas: Formula[], category: string) {
  return uniqueSorted(formulas.filter((item) => item.category === category).map((item) => item.medication));
}

export function formulationsInMedication(formulas: Formula[], category: string, medication: string) {
  return formulas
    .filter((item) => item.category === category && item.medication === medication)
    .sort((a, b) => a.formulation.localeCompare(b.formulation));
}

export function formulaByProductId(formulas: Formula[], productId?: string) {
  return formulas.find((item) => item.productId === productId) || null;
}

export function formulaCategories() {
  return CATEGORIES;
}

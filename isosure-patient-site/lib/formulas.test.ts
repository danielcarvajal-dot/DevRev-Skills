import assert from "node:assert/strict";
import test from "node:test";
import {
  formulaForProduct,
  formulasFrom,
  formulationsInMedication,
  medicationsInCategory,
} from "./formulas";
import { PRODUCTS } from "./products";

test("each category lists every medication the pharmacy offers there", () => {
  const formulas = formulasFrom(PRODUCTS);
  const hormones = medicationsInCategory(formulas, "Hormones");
  assert.ok(hormones.includes("Testosterone"));
  assert.ok(hormones.includes("Estradiol"));
  assert.ok(hormones.includes("Progesterone"));
  for (const product of PRODUCTS.filter((item) => item.category === "Hormones")) {
    const formula = formulaForProduct(product);
    assert.ok(hormones.includes(formula.medication), `missing ${product.id}`);
  }
});

test("Testosterone Cypionate offers 200 mg/mL IM injection with ingredients", () => {
  const product = PRODUCTS.find((item) => item.id === "testosterone-cypionate");
  assert.ok(product);
  const formula = formulaForProduct(product!);
  assert.equal(formula.category, "Hormones");
  assert.equal(formula.medication, "Testosterone");
  assert.equal(formula.formulation, "Testosterone Cypionate");
  assert.equal(formula.dosageForm, "Injection");
  assert.equal(formula.route, "IM");
  assert.ok(formula.strengths.some((item) => item.label === "200 mg/mL"));
  assert.ok(formula.ingredients.some((item) => /cypionate/i.test(item.name) && item.role === "API"));
  assert.ok(formula.ingredients.some((item) => /cottonseed/i.test(item.name)));
});

test("selecting Testosterone shows every offered formulation and strength", () => {
  const formulas = formulasFrom(PRODUCTS);
  const tes = formulationsInMedication(formulas, "Hormones", "Testosterone");
  assert.ok(tes.some((item) => item.formulation === "Testosterone Cypionate"));
  assert.ok(tes.some((item) => item.formulation === "Testosterone Gel"));
  const cyp = tes.find((item) => item.formulation === "Testosterone Cypionate")!;
  assert.deepEqual(
    cyp.strengths.map((item) => item.label),
    ["200 mg/mL", "100 mg/mL"],
  );
});

import assert from "node:assert/strict";
import test from "node:test";
import { CATEGORIES, PRODUCTS, normalizeCategory } from "./products";

test("formulary uses Hormones, Pain Management, Dermatology, Weight Management, and Sexual Health", () => {
  assert.deepEqual(CATEGORIES, [
    "Hormones",
    "Pain Management",
    "Dermatology",
    "Weight Management",
    "Sexual Health",
  ]);
  for (const product of PRODUCTS) {
    assert.ok(CATEGORIES.includes(product.category), `${product.id} has unknown category ${product.category}`);
  }
  assert.equal(PRODUCTS.find((p) => p.id === "estradiol-cream")?.category, "Hormones");
  assert.equal(PRODUCTS.find((p) => p.id === "ketoprofen-cream")?.category, "Pain Management");
  assert.equal(PRODUCTS.find((p) => p.id === "tretinoin")?.category, "Dermatology");
  assert.equal(PRODUCTS.find((p) => p.id === "semaglutide-injection")?.category, "Weight Management");
  assert.equal(PRODUCTS.find((p) => p.id === "sildenafil-troche")?.category, "Sexual Health");
  assert.equal(PRODUCTS.find((p) => p.id === "testosterone-cypionate")?.category, "Hormones");
});

test("legacy category names remap onto the new list", () => {
  assert.equal(normalizeCategory("Hormone Therapy"), "Hormones");
  assert.equal(normalizeCategory("Pain & Inflammation"), "Pain Management");
  assert.equal(normalizeCategory("Wellness", "semaglutide-injection"), "Weight Management");
  assert.equal(normalizeCategory("Men's Health", "sildenafil-troche"), "Sexual Health");
});

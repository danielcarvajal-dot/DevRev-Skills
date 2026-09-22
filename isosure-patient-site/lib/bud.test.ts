import assert from "node:assert/strict";
import test from "node:test";
import { calculateBud, potencyAdjustedQty, usp795Default, usp797Default } from "./bud";

const t0 = "2026-08-01T12:00:00.000Z";

test("USP 795 unpreserved aqueous is 14 days refrigerated", () => {
  const result = calculateBud({
    chapter: "795",
    compoundedAt: t0,
    vehicle: "aqueous-unpreserved",
  });
  assert.equal(result.hours, 14 * 24);
  assert.equal(result.storage, "refrigerated");
  assert.equal(result.cappedBy, "chapter");
  assert.match(result.basis, /<795>/);
});

test("USP 795 preserved aqueous is 35 days", () => {
  const result = calculateBud({
    chapter: "795",
    compoundedAt: t0,
    vehicle: "aqueous-preserved",
    refrigerated: false,
  });
  assert.equal(result.hours, 35 * 24);
  assert.equal(result.storage, "CRT");
});

test("USP 795 nonaqueous solid is 180 days", () => {
  const def = usp795Default("nonaqueous-solid", false);
  assert.equal(def.hours, 180 * 24);
});

test("stability study shortens a chapter default", () => {
  const result = calculateBud({
    chapter: "795",
    compoundedAt: t0,
    vehicle: "nonaqueous-solid",
    stabilityDays: 30,
  });
  assert.equal(result.hours, 30 * 24);
  assert.equal(result.cappedBy, "stability");
});

test("earliest ingredient expiration caps BUD", () => {
  const result = calculateBud({
    chapter: "795",
    compoundedAt: t0,
    vehicle: "nonaqueous-solid",
    ingredientExpires: ["2026-08-11T12:00:00.000Z", "2027-01-01T00:00:00.000Z"],
  });
  assert.equal(result.hours, 10 * 24);
  assert.equal(result.cappedBy, "ingredient");
});

test("USP 797 Category 1 CRT is 12 hours", () => {
  const result = calculateBud({
    chapter: "797",
    compoundedAt: t0,
    sterileCategory: 1,
    refrigerated: false,
  });
  assert.equal(result.hours, 12);
  assert.match(result.basis, /<797>/);
});

test("USP 797 Category 2 sterile start, no sterility test, fridge is 10 days", () => {
  const def = usp797Default({
    sterileCategory: 2,
    startingComponentsSterile: true,
    sterilityTested: false,
    refrigerated: true,
    frozen: false,
  });
  assert.equal(def.hours, 10 * 24);
  assert.equal(def.storage, "refrigerated");
});

test("potency adjustment increases weigh quantity when assay is below 100%", () => {
  assert.equal(potencyAdjustedQty(10, 98), 10.204);
  assert.equal(potencyAdjustedQty(5, 100), 5);
});

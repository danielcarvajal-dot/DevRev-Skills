import assert from "node:assert/strict";
import test from "node:test";
import { INGREDIENTS, MFRS, seedLots } from "./lims-catalog";
import { advanceCr, pickLot } from "./lims";

test("picks the soonest-expiring usable lot (FEFO)", () => {
  const lots = seedLots();
  const picked = pickLot("ketoprofen", lots);
  assert.equal(picked?.lotNumber, "KETO-23990");
  assert.notEqual(picked?.lotNumber, "KETO-22101");
});

test("will not leave intake without an MFR", () => {
  const result = advanceCr({
    cr: {
      id: "x",
      mfrId: "",
      orderId: "o",
      itemIndex: 0,
      productName: "Unknown",
      doseLabel: "—",
      patientName: "Pat",
      batchLot: "CR-1",
      stage: "intake",
      createdAt: new Date().toISOString(),
      compoundedBy: "RPh",
      verifiedBy: "",
      ingredientsUsed: [],
      budDate: "",
      budHours: 0,
      budBasis: "",
      budStorage: "CRT",
      budCappedBy: "chapter",
      labelPrinted: false,
      labelText: "",
      notes: "",
      hd: false,
    },
    mfrs: MFRS,
    lots: seedLots(),
    ingredients: INGREDIENTS,
    pharmacist: "RPh",
  });
  assert.match(result.error || "", /MFR/);
  assert.equal(result.cr.stage, "intake");
});

test("formula → compounding assigns lots and a BUD", () => {
  const mfr = MFRS.find((item) => item.id === "mfr-ldn-45")!;
  const result = advanceCr({
    cr: {
      id: "ldn",
      mfrId: mfr.id,
      orderId: "o",
      itemIndex: 0,
      productName: "LDN",
      doseLabel: "4.5 mg",
      patientName: "Sam",
      batchLot: "CR-2",
      stage: "formula",
      createdAt: new Date().toISOString(),
      compoundedBy: "RPh",
      verifiedBy: "",
      ingredientsUsed: [],
      budDate: "",
      budHours: 0,
      budBasis: "",
      budStorage: "CRT",
      budCappedBy: "chapter",
      labelPrinted: false,
      labelText: "",
      notes: "",
      hd: false,
    },
    mfrs: MFRS,
    lots: seedLots(),
    ingredients: INGREDIENTS,
    pharmacist: "RPh",
  });
  assert.equal(result.cr.stage, "compounding");
  assert.ok(result.cr.budHours > 0);
  assert.equal(result.cr.ingredientsUsed.length, 2);
  assert.ok(result.cr.ingredientsUsed.every((row) => row.lotId));
});

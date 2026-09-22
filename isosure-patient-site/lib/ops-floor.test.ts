import assert from "node:assert/strict";
import test from "node:test";
import { INGREDIENTS, MFRS, seedLots } from "./lims-catalog";
import { createCrsForOrder, seedDemoCrs } from "./lims";
import {
  filterFloor,
  groupByApi,
  kpiPoints,
  normalizeCr,
  primaryApi,
  reorderAlerts,
  roundUpToBatch,
} from "./ops-floor";
import type { CompoundingRecord } from "./lims-types";
import type { Order as PortalOrder } from "./types";

const e2 = MFRS.find((item) => item.id === "mfr-e2-05")!;
const ldn = MFRS.find((item) => item.id === "mfr-ldn-45")!;
const nad = MFRS.find((item) => item.id === "mfr-nad-50")!;

test("rounds ordered quantity up to the next MFR batch size", () => {
  assert.equal(roundUpToBatch(25, 30), 30);
  assert.equal(roundUpToBatch(30, 30), 30);
  assert.equal(roundUpToBatch(31, 30), 60);
  assert.equal(roundUpToBatch(10, 15), 15);
  assert.equal(roundUpToBatch(0, 30), 30);
  assert.equal(roundUpToBatch(7, 0), 7);
});

test("createCrsForOrder stores ordered qty and the auto-rounded compound qty", () => {
  const order = {
    id: "round-order",
    items: [
      {
        productId: "ldn-caps",
        doseId: "ldn-45",
        productName: "IsoReset Low-Dose Naltrexone",
        doseLabel: "4.5 mg",
        quantity: 25,
        unitPrice: 48,
      },
    ],
    patientName: "Sam Rivera",
    notes: "",
  } as PortalOrder;
  const [cr] = createCrsForOrder({
    order,
    mfrs: MFRS,
    ingredients: INGREDIENTS,
    pharmacist: "RPh",
  });
  assert.equal(cr.orderedQty, 25);
  assert.equal(cr.compoundQty, 30);
  assert.equal(cr.qtyManuallyAdjusted, false);
  assert.equal(cr.priority, "routine");
});

test("KPI points add HD, sterile, STAT, and today load", () => {
  const base = { hd: false, priority: "routine" as const };
  assert.equal(kpiPoints(base as CompoundingRecord, ldn), 1);
  assert.equal(kpiPoints({ ...base, hd: true } as CompoundingRecord, e2), 3);
  assert.equal(kpiPoints({ hd: true, priority: "today" } as CompoundingRecord, e2), 4);
  assert.equal(kpiPoints({ hd: true, priority: "stat" } as CompoundingRecord, e2), 5);
  assert.equal(kpiPoints({ hd: false, priority: "today" } as CompoundingRecord, nad), 4);
  assert.equal(kpiPoints({ hd: true, priority: "stat" } as CompoundingRecord, nad), 7);
});

test("lab floor filters by priority, HD, sterile, and nonsterile", () => {
  const floor = seedDemoCrs();
  assert.equal(filterFloor(floor, MFRS, "all").length, floor.length);
  const priority = filterFloor(floor, MFRS, "priority");
  assert.ok(priority.every((cr) => cr.priority === "stat" || cr.priority === "today"));
  assert.ok(priority.some((cr) => cr.priority === "stat"));
  const hd = filterFloor(floor, MFRS, "hd");
  assert.ok(hd.length >= 2);
  assert.ok(hd.every((cr) => cr.hd));
  const sterile = filterFloor(floor, MFRS, "sterile");
  assert.ok(sterile.length >= 1);
  assert.ok(sterile.every((cr) => cr.mfrId === "mfr-nad-50"));
  const nonsterile = filterFloor(floor, MFRS, "nonsterile");
  assert.ok(nonsterile.every((cr) => cr.mfrId !== "mfr-nad-50"));
  assert.equal(sterile.length + nonsterile.length, floor.length);
});

test("groups open compounds by primary API for a complete daily list", () => {
  const groups = groupByApi(seedDemoCrs(), MFRS, INGREDIENTS);
  const names = groups.map((group) => group.apiName);
  assert.ok(names.some((name) => /estradiol/i.test(name)));
  assert.ok(names.some((name) => /progesterone/i.test(name)));
  assert.ok(names.some((name) => /naltrexone/i.test(name)));
  assert.ok(names.some((name) => /ketoprofen/i.test(name)));
  const e2Group = groups.find((group) => group.apiId === "estradiol")!;
  assert.equal(e2Group.cas, "50-28-2");
  assert.ok(e2Group.points >= 5);
  assert.equal(primaryApi(seedDemoCrs()[0]!, MFRS, INGREDIENTS)?.id, "estradiol");
});

test("reorder alerts fire when usable on-hand is below the ingredient point", () => {
  const alerts = reorderAlerts(INGREDIENTS, seedLots());
  const keto = alerts.find((row) => row.ingredient.id === "ketoprofen");
  const nadRow = alerts.find((row) => row.ingredient.id === "nad");
  assert.ok(keto);
  assert.ok(keto.remaining < keto.point);
  assert.ok(nadRow);
  assert.ok(nadRow.remaining < nadRow.point);
  assert.ok(!alerts.some((row) => row.ingredient.id === "estradiol"));
});

test("normalizeCr fills floor fields without wiping a manual qty", () => {
  const cr = normalizeCr({
    id: "x",
    mfrId: "mfr-ldn-45",
    orderId: "o",
    itemIndex: 0,
    productName: "LDN",
    doseLabel: "4.5 mg",
    patientName: "Sam",
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
    orderedQty: 25,
    compoundQty: 28,
    qtyManuallyAdjusted: true,
  } as CompoundingRecord);
  assert.equal(cr.compoundQty, 28);
  assert.equal(cr.priority, "routine");
  assert.equal(cr.assignedTech, "");
  assert.equal(cr.sortIndex, 0);
});

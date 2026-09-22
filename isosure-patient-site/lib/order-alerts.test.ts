import assert from "node:assert/strict";
import test from "node:test";
import { canSubmitOrder, evaluateOrderAlerts } from "./order-alerts";
import { EMPTY_ADDRESS } from "./patients";
import { PRODUCTS } from "./products";
import type { Order, Patient, Prescription } from "./types";

function patient(overrides: Partial<Patient> = {}): Patient {
  return {
    id: "pat-1",
    firstName: "John",
    lastName: "Smith",
    dob: "1980-04-12",
    sex: "male",
    phone: "(503) 555-0100",
    email: "john@example.com",
    address: { ...EMPTY_ADDRESS, line1: "1 Main St", city: "Portland", state: "OR", zip: "97214" },
    allergies: "",
    clinicalNotes: "",
    weightKg: "82",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function rx(overrides: Partial<Prescription> = {}): Partial<Prescription> {
  return {
    productId: "progesterone-caps",
    doseId: "p4-100",
    directions: "Take 1 capsule by mouth at bedtime",
    quantity: 30,
    quantityUnit: "capsules",
    refills: 2,
    daw: false,
    notes: "",
    doseAmount: "",
    volumeMl: "",
    ...overrides,
  };
}

function order(overrides: Partial<Order> = {}): Order {
  return {
    id: "ord-1",
    placedAt: new Date().toISOString(),
    items: [
      {
        productId: "progesterone-caps",
        doseId: "p4-100",
        quantity: 30,
        productName: "IsoCalm Progesterone Capsules",
        doseLabel: "100 mg",
        unitPrice: 52,
      },
    ],
    subtotal: 52,
    shipping: 8,
    total: 60,
    status: "InProduction",
    address: EMPTY_ADDRESS,
    notes: "",
    patientName: "John Smith",
    patientDob: "1980-04-12",
    patientId: "pat-1",
    practiceName: "Demo",
    prescriberName: "Dr. Jane Smith",
    npi: "1",
    scripts: [],
    ...overrides,
  };
}

const progesterone = PRODUCTS.find((item) => item.id === "progesterone-caps")!;
const p4_200 = progesterone.doses.find((item) => item.id === "p4-200")!;
const p4_100 = progesterone.doses.find((item) => item.id === "p4-100")!;
const sema = PRODUCTS.find((item) => item.id === "semaglutide-injection")!;
const semaDose = sema.doses.find((item) => item.id === "sema-5")!;

test("blocks missing directions and quantity", () => {
  const alerts = evaluateOrderAlerts({
    patient: patient(),
    product: progesterone,
    dose: p4_100,
    prescription: rx({ directions: " ", quantity: 0 }),
    orders: [],
  });
  assert.equal(alerts.some((item) => item.id === "missing-directions" && item.severity === "block"), true);
  assert.equal(alerts.some((item) => item.id === "missing-quantity" && item.severity === "block"), true);
  assert.equal(canSubmitOrder(alerts, []), false);
});

test("warns when capsule strength exceeds starting dose", () => {
  const alerts = evaluateOrderAlerts({
    patient: patient(),
    product: progesterone,
    dose: p4_200,
    prescription: rx({ doseId: "p4-200" }),
    orders: [],
  });
  const high = alerts.find((item) => item.id === "high-dose");
  assert.ok(high);
  assert.equal(high?.severity, "warn");
  assert.match(high?.body || "", /starting dose/i);
  assert.equal(canSubmitOrder(alerts, []), false);
  assert.equal(canSubmitOrder(alerts, ["high-dose"]), true);
});

test("blocks injection orders missing weight, dose, and volume", () => {
  const alerts = evaluateOrderAlerts({
    patient: patient({ weightKg: "" }),
    product: sema,
    dose: semaDose,
    prescription: rx({
      productId: "semaglutide-injection",
      doseId: "sema-5",
      directions: "Inject weekly",
      quantity: 2,
      doseAmount: "",
      volumeMl: "",
    }),
    orders: [],
  });
  assert.equal(alerts.some((item) => item.id === "missing-weight" && item.severity === "block"), true);
  assert.equal(alerts.some((item) => item.id === "missing-dose-amount"), true);
  assert.equal(alerts.some((item) => item.id === "missing-volume"), true);
});

test("warns on duplicate active medication for the same patient", () => {
  const alerts = evaluateOrderAlerts({
    patient: patient(),
    product: progesterone,
    dose: p4_100,
    prescription: rx(),
    orders: [order()],
  });
  const dup = alerts.find((item) => item.id === "duplicate-order");
  assert.ok(dup);
  assert.equal(dup?.severity, "warn");
});

test("warns on documented allergy overlap", () => {
  const alerts = evaluateOrderAlerts({
    patient: patient({ allergies: "Progesterone, peanuts" }),
    product: progesterone,
    dose: p4_100,
    prescription: rx(),
    orders: [],
  });
  const allergy = alerts.find((item) => item.id === "allergy");
  assert.ok(allergy);
  assert.match(allergy?.body || "", /progesterone/i);
});

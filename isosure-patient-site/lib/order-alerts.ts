import { orderableMeta, parseMg } from "./orderables";
import type { Dose, Order, OrderAlert, Patient, Prescription, Product } from "./types";

const ACTIVE_STATUSES = new Set([
  "Submitted",
  "Received",
  "ClarificationNeeded",
  "Backorder",
  "InProduction",
  "ReadyPickup",
  "OutForDelivery",
]);

export type AlertInput = {
  patient: Patient | null;
  product: Product | null;
  dose: Dose | null;
  prescription: Partial<Prescription>;
  orders: Order[];
};

function splitList(value: string) {
  return value
    .split(/[,;/]+/)
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
}

export function evaluateOrderAlerts(input: AlertInput): OrderAlert[] {
  const { patient, product, dose, prescription, orders } = input;
  const alerts: OrderAlert[] = [];

  if (!patient) {
    alerts.push({
      id: "missing-patient",
      severity: "block",
      title: "Missing information",
      body: "Select or add a patient before submitting this order.",
    });
  }

  if (!product || !dose) {
    alerts.push({
      id: "missing-medication",
      severity: "block",
      title: "Missing information",
      body: "Choose a medication and strength to continue.",
    });
    return alerts;
  }

  const meta = orderableMeta(product);

  if (!String(prescription.directions || "").trim()) {
    alerts.push({
      id: "missing-directions",
      severity: "block",
      title: "Missing information",
      body: "Directions are required for this prescription.",
    });
  }

  const quantity = Number(prescription.quantity);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    alerts.push({
      id: "missing-quantity",
      severity: "block",
      title: "Missing information",
      body: "Enter a quantity greater than zero.",
    });
  }

  if (meta?.requireWeight && patient && !String(patient.weightKg || "").trim()) {
    alerts.push({
      id: "missing-weight",
      severity: "block",
      title: "Missing information",
      body: "Patient weight is required for this medication.",
    });
  }

  if (meta?.workflowKind === "injection") {
    if (!String(prescription.doseAmount || "").trim()) {
      alerts.push({
        id: "missing-dose-amount",
        severity: "block",
        title: "Missing information",
        body: "Enter the prescribed dose (mg) for this injection.",
      });
    }
    if (!String(prescription.volumeMl || "").trim()) {
      alerts.push({
        id: "missing-volume",
        severity: "block",
        title: "Missing information",
        body: "Enter the volume (mL) to dispense for this injection.",
      });
    }
  }

  const prescribedMg =
    meta?.workflowKind === "injection"
      ? parseMg(String(prescription.doseAmount || ""))
      : parseMg(dose.strength) ?? parseMg(dose.label);
  if (meta?.startingDoseMg != null && prescribedMg != null && prescribedMg > meta.startingDoseMg) {
    alerts.push({
      id: "high-dose",
      severity: "warn",
      title: "Please review",
      body: `The prescribed dose exceeds the recommended starting dose for this product (${meta.startingDoseMg} mg).`,
    });
  }

  if (patient) {
    const duplicate = orders.find((order) => {
      if (!ACTIVE_STATUSES.has(order.status)) return false;
      const samePatient =
        order.patientId === patient.id ||
        (order.patientName.toLowerCase() === `${patient.firstName} ${patient.lastName}`.trim().toLowerCase() &&
          order.patientDob === patient.dob);
      return samePatient && order.items.some((item) => item.productId === product.id);
    });
    if (duplicate) {
      alerts.push({
        id: "duplicate-order",
        severity: "warn",
        title: "Potential duplicate",
        body: `This patient has an active order for the same medication (${product.shortName}).`,
      });
    }

    const documented = splitList(patient.allergies);
    if (documented.length) {
      const tags = meta.allergyTags.map((tag) => tag.toLowerCase());
      const hit = documented.find(
        (allergy) =>
          tags.some((tag) => allergy.includes(tag) || tag.includes(allergy)) ||
          product.name.toLowerCase().includes(allergy) ||
          product.shortName.toLowerCase().includes(allergy),
      );
      if (hit) {
        alerts.push({
          id: "allergy",
          severity: "warn",
          title: "Allergy alert",
          body: `Patient has a documented allergy to ${hit}.`,
        });
      }
    }
  }

  return alerts;
}

export function canSubmitOrder(alerts: OrderAlert[], acknowledgedIds: string[]) {
  if (alerts.some((alert) => alert.severity === "block")) return false;
  return alerts
    .filter((alert) => alert.severity === "warn")
    .every((alert) => acknowledgedIds.includes(alert.id));
}

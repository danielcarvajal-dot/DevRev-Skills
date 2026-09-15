/**
 * Operations service seam.
 *
 * The Provider Portal is a thin client: it submits orders, documents, and
 * refill requests, then displays status and notifications that Operations
 * returns. Clinical and compounding logic (formulas, BUD, mixing, QC)
 * must stay in Operations — never in the provider UI.
 */
import type {
  NotificationKind,
  Order,
  OrderStatus,
  PortalNotification,
  RefillRequest,
} from "./types";

export const ORDER_STATUSES: OrderStatus[] = [
  "Submitted",
  "Received",
  "ClarificationNeeded",
  "Backorder",
  "InProduction",
  "ReadyPickup",
  "OutForDelivery",
  "Delivered",
];

/** Labels the provider is allowed to see. No compounding steps. */
export const PROVIDER_STATUS_LABEL: Record<OrderStatus, string> = {
  Submitted: "Submitted to operations",
  Received: "Received by operations",
  ClarificationNeeded: "Clarification needed",
  Backorder: "Backordered",
  InProduction: "In production",
  ReadyPickup: "Ready for pickup",
  OutForDelivery: "Out for delivery",
  Delivered: "Delivered",
};

export const DOCUMENT_KIND_LABEL = {
  rx: "Rx image",
  pa: "PA form",
  formula: "Patient-specific formula",
  other: "Other document",
} as const;

export function notificationForStatus(order: Order, status: OrderStatus): PortalNotification | null {
  const kind = kindForStatus(status);
  if (!kind) return null;
  const copy = copyForStatus(order, status);
  return {
    id: crypto.randomUUID(),
    kind,
    title: copy.title,
    body: copy.body,
    orderId: order.id,
    createdAt: new Date().toISOString(),
    read: false,
  };
}

function kindForStatus(status: OrderStatus): NotificationKind | null {
  if (status === "Backorder") return "backorder";
  if (status === "ClarificationNeeded") return "clarification";
  if (status === "ReadyPickup") return "ready_pickup";
  if (status === "OutForDelivery") return "ready_delivery";
  if (status === "Received" || status === "Delivered") return "order_update";
  return null;
}

function copyForStatus(order: Order, status: OrderStatus) {
  const ticket = `ISO-${order.id.slice(-6).toUpperCase()}`;
  switch (status) {
    case "Backorder":
      return {
        title: `Backorder on ${ticket}`,
        body: `Operations placed ${order.patientName}'s order on backorder. No compounding details are shown here — reply from the order ticket if the practice needs to change the request.`,
      };
    case "ClarificationNeeded":
      return {
        title: `Clarification needed on ${ticket}`,
        body: `Operations needs a clarification on ${order.patientName}'s order. Upload a note or document from the exchange. The lab keeps the compounding logic.`,
      };
    case "ReadyPickup":
      return {
        title: `Ready for pickup · ${ticket}`,
        body: `${order.patientName}'s order is ready for pickup at the ISOSure pharmacy.`,
      };
    case "OutForDelivery":
      return {
        title: `Out for delivery · ${ticket}`,
        body: `${order.patientName}'s order is out for delivery.`,
      };
    case "Delivered":
      return {
        title: `Delivered · ${ticket}`,
        body: `${order.patientName}'s order was marked delivered by operations.`,
      };
    default:
      return {
        title: `Order update · ${ticket}`,
        body: `Operations updated ${order.patientName}'s order to “${PROVIDER_STATUS_LABEL[status]}”.`,
      };
  }
}

export function refillNotification(refill: RefillRequest): PortalNotification {
  return {
    id: crypto.randomUUID(),
    kind: "refill",
    title: `Refill ${refill.status.toLowerCase()}`,
    body: `Operations ${refill.status.toLowerCase()} the refill for ${refill.patientName} (${refill.summary}).`,
    orderId: refill.orderId,
    createdAt: new Date().toISOString(),
    read: false,
  };
}

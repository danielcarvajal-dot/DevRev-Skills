import type {
  Doctor,
  ExchangeDocument,
  Order,
  PharmacyUser,
  PortalNotification,
  RefillRequest,
} from "./types";

export function demoDoctor(): Doctor {
  return {
    id: "demo-practice",
    role: "doctor",
    loginKind: "prescriber",
    practiceName: "Hawthorne Family Medicine",
    prescriberName: "Dr. Maya Ellison, MD",
    npi: "1234567890",
    dea: "BE1234563",
    email: "orders@hawthornefm.example",
    phone: "(503) 555-0148",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 80).toISOString(),
  };
}

export function demoPharmacy(): PharmacyUser {
  return {
    id: "demo-pharmacy",
    role: "pharmacy",
    pharmacyName: "ISOSure Compounding Lab",
    contactName: "Jordan Hale, RPh",
    email: "pharmacy@isosure.example",
    phone: "(800) 555-4767",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 120).toISOString(),
  };
}

const address = {
  line1: "418 Hawthorne Blvd",
  line2: "Suite 2",
  city: "Portland",
  state: "OR",
  zip: "97214",
};

export function seedDemoOrders(): Order[] {
  return [
    {
      id: "demo-order-1",
      placedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
      status: "InProduction",
      subtotal: 120,
      shipping: 0,
      total: 120,
      notes: "Match last fill.",
      patientName: "Avery Nguyen",
      patientDob: "1986-04-12",
      practiceName: "Hawthorne Family Medicine",
      prescriberName: "Dr. Maya Ellison, MD",
      npi: "1234567890",
      scripts: [],
      address,
      items: [
        {
          productId: "estradiol-cream",
          doseId: "e2-05",
          quantity: 1,
          productName: "IsoBalance Estradiol Cream",
          doseLabel: "0.5 mg/g",
          unitPrice: 56,
        },
        {
          productId: "progesterone-caps",
          doseId: "p4-100",
          quantity: 1,
          productName: "IsoCalm Progesterone Capsules",
          doseLabel: "100 mg",
          unitPrice: 52,
        },
      ],
    },
    {
      id: "demo-order-2",
      placedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
      status: "ClarificationNeeded",
      subtotal: 38,
      shipping: 8,
      total: 46,
      notes: "",
      patientName: "Sam Rivera",
      patientDob: "1979-11-02",
      practiceName: "Hawthorne Family Medicine",
      prescriberName: "Dr. Maya Ellison, MD",
      npi: "1234567890",
      scripts: [],
      address,
      items: [
        {
          productId: "ldn-caps",
          doseId: "ldn-45",
          quantity: 1,
          productName: "IsoReset Low-Dose Naltrexone",
          doseLabel: "4.5 mg",
          unitPrice: 38,
        },
      ],
    },
    {
      id: "demo-order-3",
      placedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      status: "ReadyPickup",
      subtotal: 64,
      shipping: 8,
      total: 72,
      notes: "",
      patientName: "Lee Park",
      patientDob: "1991-07-19",
      practiceName: "Hawthorne Family Medicine",
      prescriberName: "Dr. Maya Ellison, MD",
      npi: "1234567890",
      scripts: [],
      address,
      items: [
        {
          productId: "ketoprofen-cream",
          doseId: "keto-10",
          quantity: 1,
          productName: "IsoEase Ketoprofen Cream",
          doseLabel: "10%",
          unitPrice: 46,
        },
      ],
    },
  ];
}

export function seedDemoDocuments(): ExchangeDocument[] {
  return [
    {
      id: "doc-rx-1",
      name: "nguyen-hrt-rx.pdf",
      type: "application/pdf",
      size: 48200,
      dataUrl: "",
      kind: "rx",
      orderId: "demo-order-1",
      uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
      uploadedBy: "provider",
    },
    {
      id: "doc-pa-1",
      name: "rivera-ldn-pa.pdf",
      type: "application/pdf",
      size: 31100,
      dataUrl: "",
      kind: "pa",
      orderId: "demo-order-2",
      uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
      uploadedBy: "provider",
    },
    {
      id: "doc-formula-1",
      name: "nguyen-patient-formula.pdf",
      type: "application/pdf",
      size: 18400,
      dataUrl: "",
      kind: "formula",
      orderId: "demo-order-1",
      uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 11).toISOString(),
      uploadedBy: "provider",
    },
  ];
}

export function seedDemoNotifications(): PortalNotification[] {
  return [
    {
      id: "note-clarify",
      kind: "clarification",
      title: "Clarification needed on ISO-RDER-2",
      body: "Operations needs a clarification on Sam Rivera’s LDN order. Upload a note or PA from the document exchange. Compounding stays in the lab.",
      orderId: "demo-order-2",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
      read: false,
    },
    {
      id: "note-pickup",
      kind: "ready_pickup",
      title: "Ready for pickup · ISO-RDER-3",
      body: "Lee Park’s order is ready for pickup at the ISOSure pharmacy.",
      orderId: "demo-order-3",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      read: false,
    },
    {
      id: "note-backorder",
      kind: "backorder",
      title: "Backorder watch",
      body: "Operations flagged a possible backorder on a thyroid capsule strength. No lab formula is shown in the provider portal.",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
      read: true,
    },
  ];
}

export function seedDemoRefills(): RefillRequest[] {
  return [
    {
      id: "refill-1",
      orderId: "demo-order-1",
      patientName: "Avery Nguyen",
      summary: "Estradiol cream 0.5 mg/g · Progesterone 100 mg",
      notes: "Continue current strength.",
      requestedAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
      status: "Submitted",
    },
  ];
}

import type { Doctor, Order, PharmacyUser } from "./types";

export function demoDoctor(): Doctor {
  return {
    id: "demo-practice",
    role: "doctor",
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

export function seedDemoOrders(): Order[] {
  return [
    {
      id: "demo-order-1",
      placedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
      status: "Compounding",
      subtotal: 120,
      shipping: 0,
      total: 120,
      notes: "Match last fill. Patient prefers unscented cream.",
      patientName: "Avery Nguyen",
      patientDob: "1986-04-12",
      practiceName: "Hawthorne Family Medicine",
      prescriberName: "Dr. Maya Ellison, MD",
      npi: "1234567890",
      scripts: [],
      address: {
        line1: "418 Hawthorne Blvd",
        line2: "Suite 2",
        city: "Portland",
        state: "OR",
        zip: "97214",
      },
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
      status: "Received",
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
      address: {
        line1: "418 Hawthorne Blvd",
        line2: "Suite 2",
        city: "Portland",
        state: "OR",
        zip: "97214",
      },
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
  ];
}

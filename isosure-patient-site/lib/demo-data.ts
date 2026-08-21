import type { Order, Patient } from "./types";

export function demoPatient(): Omit<Patient, "id" | "createdAt"> {
  return {
    firstName: "Avery",
    lastName: "Nguyen",
    email: "avery.nguyen@example.com",
    phone: "(503) 555-0148",
    dateOfBirth: "1986-04-12",
  };
}

export function seedDemoOrders(): Order[] {
  return [
    {
      id: "demo-order-1",
      placedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 46).toISOString(),
      status: "Delivered",
      subtotal: 120,
      shipping: 0,
      total: 120,
      notes: "Refill of evening progesterone with estradiol cream.",
      address: {
        line1: "418 Hawthorne Blvd",
        line2: "Apt 3",
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
      placedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18).toISOString(),
      status: "Shipped",
      subtotal: 38,
      shipping: 8,
      total: 46,
      notes: "",
      address: {
        line1: "418 Hawthorne Blvd",
        line2: "Apt 3",
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

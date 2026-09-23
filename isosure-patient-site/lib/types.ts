export type Role = "doctor" | "pharmacy" | "qa" | "rph";
export type ProviderLoginKind = "prescriber" | "facility";

export type Category =
  | "Hormones"
  | "Pain Management"
  | "Dermatology"
  | "Weight Management"
  | "Sexual Health";

export type Form =
  | "Cream"
  | "Gel"
  | "Capsule"
  | "Troche"
  | "Suspension"
  | "Nasal spray"
  | "Topical"
  | "Injection"
  | "Suppository";

/** How the provider order form behaves. Pharmacy maps this to an MFR internally. */
export type WorkflowKind =
  | "capsule"
  | "cream"
  | "gel"
  | "troche"
  | "injection"
  | "suppository"
  | "suspension"
  | "spray"
  | "topical";

export type Sex = "female" | "male" | "other" | "unspecified";

export type Dose = {
  id: string;
  label: string;
  strength: string;
  price: number;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  category: Category | string;
  form: Form | string;
  summary: string;
  description: string;
  howToUse: string;
  tags: string[];
  doses: Dose[];
  featured?: boolean;
  requiresRx: boolean;
  /** Prescribable family shown to the provider (e.g. Progesterone, Semaglutide). */
  family?: string;
  familySlug?: string;
  searchTerms?: string[];
  workflowKind?: WorkflowKind;
  startingDoseMg?: number;
  requireWeight?: boolean;
  allergyTags?: string[];
  defaultDirections?: string;
  quantityUnit?: string;
  defaultQuantity?: number;
};

export type CartItem = {
  productId: string;
  doseId: string;
  quantity: number;
};

export type ClinicCard = {
  nameOnCard: string;
  brand: string;
  last4: string;
  expMonth: string;
  expYear: string;
};

export type Doctor = {
  id: string;
  role: "doctor";
  username?: string;
  loginKind: ProviderLoginKind;
  practiceName: string;
  prescriberName: string;
  address: Address;
  phone: string;
  npi: string;
  stateLicense: string;
  dea: string;
  clinicCard: ClinicCard | null;
  email: string;
  createdAt: string;
};

export type PharmacyUser = {
  id: string;
  role: "pharmacy";
  username?: string;
  pharmacyName: string;
  contactName: string;
  email: string;
  phone: string;
  createdAt: string;
};

export type QualityUser = {
  id: string;
  role: "qa";
  username?: string;
  displayName: string;
  email: string;
  createdAt: string;
};

export type PharmacistUser = {
  id: string;
  role: "rph";
  username?: string;
  displayName: string;
  pharmacyName: string;
  email: string;
  createdAt: string;
};

export type SessionUser = Doctor | PharmacyUser | QualityUser | PharmacistUser;

export type Address = {
  line1: string;
  line2: string;
  city: string;
  state: string;
  zip: string;
};

export type DocumentKind = "rx" | "pa" | "formula" | "other";

export type ExchangeDocument = {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  kind: DocumentKind;
  orderId?: string;
  uploadedAt: string;
  uploadedBy: "provider" | "operations";
};

/** @deprecated Use ExchangeDocument. Kept as an alias for checkout drafts. */
export type ScriptFile = ExchangeDocument;

export type OrderItem = CartItem & {
  productName: string;
  doseLabel: string;
  unitPrice: number;
};

/** Operations-owned statuses. Provider portal only displays labels. */
export type OrderStatus =
  | "Submitted"
  | "Received"
  | "ClarificationNeeded"
  | "Backorder"
  | "InProduction"
  | "ReadyPickup"
  | "OutForDelivery"
  | "Delivered";

export type Patient = {
  id: string;
  firstName: string;
  lastName: string;
  dob: string;
  sex: Sex;
  phone: string;
  email: string;
  address: Address;
  allergies: string;
  card: ClinicCard | null;
  clinicalNotes: string;
  weightKg: string;
  createdAt: string;
};

/** What the provider is ordering for this patient — not the pharmacy formula. */
export type Prescription = {
  productId: string;
  doseId: string;
  directions: string;
  quantity: number;
  quantityUnit: string;
  refills: number;
  daw: boolean;
  notes: string;
  /** Injection / concentration-based products. */
  doseAmount: string;
  volumeMl: string;
};

export type OrderDraft = {
  id: string;
  patientId: string | null;
  prescription: Partial<Prescription>;
  acknowledgedAlertIds: string[];
  updatedAt: string;
};

export type AlertSeverity = "block" | "warn";

export type OrderAlert = {
  id: string;
  severity: AlertSeverity;
  title: string;
  body: string;
};

export type Order = {
  id: string;
  placedAt: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  address: Address;
  notes: string;
  patientName: string;
  patientDob: string;
  patientId?: string;
  practiceName: string;
  prescriberName: string;
  npi: string;
  scripts: ExchangeDocument[];
  prescription?: Prescription;
};

export type NotificationKind =
  | "backorder"
  | "clarification"
  | "ready_pickup"
  | "ready_delivery"
  | "order_update"
  | "refill";

export type PortalNotification = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  orderId?: string;
  createdAt: string;
  read: boolean;
};

export type RefillStatus = "Submitted" | "Accepted" | "Declined";

export type RefillRequest = {
  id: string;
  orderId: string;
  patientName: string;
  summary: string;
  notes: string;
  requestedAt: string;
  status: RefillStatus;
};

export type Category =
  | "Hormone Therapy"
  | "Thyroid"
  | "Pain & Inflammation"
  | "Dermatology"
  | "Wellness"
  | "Pediatric"
  | "Men's Health"
  | "Women's Health";

export type Form =
  | "Cream"
  | "Gel"
  | "Capsule"
  | "Troche"
  | "Suspension"
  | "Nasal spray"
  | "Topical";

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
  category: Category;
  form: Form;
  summary: string;
  description: string;
  howToUse: string;
  tags: string[];
  doses: Dose[];
  featured?: boolean;
  requiresRx: boolean;
};

export type CartItem = {
  productId: string;
  doseId: string;
  quantity: number;
};

export type Patient = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  createdAt: string;
};

export type Address = {
  line1: string;
  line2: string;
  city: string;
  state: string;
  zip: string;
};

export type OrderItem = CartItem & {
  productName: string;
  doseLabel: string;
  unitPrice: number;
};

export type OrderStatus = "Received" | "Compounding" | "Shipped" | "Delivered";

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
};

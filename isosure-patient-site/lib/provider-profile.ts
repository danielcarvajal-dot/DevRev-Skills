import { EMPTY_ADDRESS } from "./patients";
import type { Address, ClinicCard, Doctor, ProviderLoginKind } from "./types";

export type ProviderProfileInput = {
  loginKind: ProviderLoginKind;
  prescriberName: string;
  practiceName: string;
  address: Address;
  phone: string;
  npi: string;
  stateLicense: string;
  dea: string;
  email: string;
  card: {
    nameOnCard: string;
    number: string;
    expMonth: string;
    expYear: string;
    cvc: string;
  };
  existingCard?: ClinicCard | null;
};

export type ProviderProfileErrors = Partial<
  Record<
    | "prescriberName"
    | "practiceName"
    | "address"
    | "phone"
    | "npi"
    | "stateLicense"
    | "dea"
    | "clinicCard",
    string
  >
>;

const HAWTHORNE_ADDRESS: Address = {
  line1: "418 Hawthorne Blvd",
  line2: "Suite 2",
  city: "Portland",
  state: "OR",
  zip: "97214",
};

export function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export function formatAddress(address: Address | undefined) {
  if (!address?.line1) return "";
  const cityLine = [address.city, address.state, address.zip].filter(Boolean).join(" ");
  return [address.line1, address.line2, cityLine].filter(Boolean).join(", ");
}

export function cardBrand(number: string) {
  const n = digitsOnly(number);
  if (/^4/.test(n)) return "Visa";
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return "Mastercard";
  if (/^3[47]/.test(n)) return "Amex";
  if (/^6(?:011|5)/.test(n)) return "Discover";
  return "Card";
}

export function tokenizeClinicCard(input: {
  nameOnCard: string;
  number: string;
  expMonth: string;
  expYear: string;
}): ClinicCard {
  const number = digitsOnly(input.number);
  return {
    nameOnCard: input.nameOnCard.trim(),
    brand: cardBrand(number),
    last4: number.slice(-4),
    expMonth: input.expMonth.padStart(2, "0"),
    expYear: normalizeYear(input.expYear),
  };
}

export function formatClinicCard(card: ClinicCard | null | undefined) {
  if (!card?.last4) return "No clinic card on file";
  return `${card.brand} •••• ${card.last4} · exp ${card.expMonth}/${card.expYear}`;
}

/** Clinic list price stays on the product. Patient cash is billed separately. */
export function patientCashPrice(clinicPrice: number) {
  return Math.round(clinicPrice * 1.2 * 100) / 100;
}

export function isCompleteProviderProfile(user: Pick<
  Doctor,
  "prescriberName" | "practiceName" | "address" | "phone" | "npi" | "stateLicense" | "dea" | "clinicCard"
> | null | undefined) {
  if (!user) return false;
  return Object.keys(validateStoredProfile(user)).length === 0;
}

export function validateStoredProfile(
  user: Pick<Doctor, "prescriberName" | "practiceName" | "address" | "phone" | "npi" | "stateLicense" | "dea" | "clinicCard">,
): ProviderProfileErrors {
  return collectErrors({
    prescriberName: user.prescriberName,
    practiceName: user.practiceName,
    address: user.address || EMPTY_ADDRESS,
    phone: user.phone,
    npi: user.npi,
    stateLicense: user.stateLicense,
    dea: user.dea,
    clinicCard: user.clinicCard,
  });
}

export function validateProviderProfile(input: ProviderProfileInput): ProviderProfileErrors {
  const card = resolveClinicCard(input);
  return collectErrors({
    prescriberName: input.prescriberName,
    practiceName: input.practiceName,
    address: input.address,
    phone: input.phone,
    npi: input.npi,
    stateLicense: input.stateLicense,
    dea: input.dea,
    clinicCard: card,
    cardDraft: input.card,
    replacingCard: Boolean(digitsOnly(input.card.number)),
  });
}

export function buildDoctorFromProfile(input: ProviderProfileInput): Omit<Doctor, "id" | "createdAt" | "role"> {
  const clinicCard = resolveClinicCard(input);
  if (!clinicCard) {
    throw new Error("Clinic card on file is required.");
  }
  return {
    loginKind: input.loginKind,
    prescriberName: input.prescriberName.trim(),
    practiceName: input.practiceName.trim(),
    address: {
      line1: input.address.line1.trim(),
      line2: input.address.line2.trim(),
      city: input.address.city.trim(),
      state: input.address.state.trim().toUpperCase(),
      zip: input.address.zip.trim(),
    },
    phone: input.phone.trim(),
    npi: digitsOnly(input.npi),
    stateLicense: input.stateLicense.trim(),
    dea: normalizeDea(input.dea),
    clinicCard,
    email: input.email.trim(),
  };
}

export function emptyProviderProfileInput(): ProviderProfileInput {
  return {
    loginKind: "prescriber",
    prescriberName: "",
    practiceName: "",
    address: { ...EMPTY_ADDRESS },
    phone: "",
    npi: "",
    stateLicense: "",
    dea: "",
    email: "",
    card: { nameOnCard: "", number: "", expMonth: "", expYear: "", cvc: "" },
    existingCard: null,
  };
}

export function inputFromDoctor(doctor: Doctor): ProviderProfileInput {
  return {
    loginKind: doctor.loginKind,
    prescriberName: doctor.prescriberName,
    practiceName: doctor.practiceName,
    address: { ...EMPTY_ADDRESS, ...doctor.address },
    phone: doctor.phone,
    npi: doctor.npi,
    stateLicense: doctor.stateLicense,
    dea: doctor.dea,
    email: doctor.email,
    card: {
      nameOnCard: doctor.clinicCard?.nameOnCard || "",
      number: "",
      expMonth: doctor.clinicCard?.expMonth || "",
      expYear: doctor.clinicCard?.expYear || "",
      cvc: "",
    },
    existingCard: doctor.clinicCard,
  };
}

export function hawthorneClinicCard(nameOnCard = "Hannah Kitner"): ClinicCard {
  return {
    nameOnCard,
    brand: "Visa",
    last4: "4242",
    expMonth: "12",
    expYear: "28",
  };
}

export function hawthorneAddress(): Address {
  return { ...HAWTHORNE_ADDRESS };
}

function resolveClinicCard(input: ProviderProfileInput): ClinicCard | null {
  if (digitsOnly(input.card.number).length >= 13) {
    return tokenizeClinicCard(input.card);
  }
  return input.existingCard || null;
}

function collectErrors(input: {
  prescriberName: string;
  practiceName: string;
  address: Address;
  phone: string;
  npi: string;
  stateLicense: string;
  dea: string;
  clinicCard: ClinicCard | null | undefined;
  cardDraft?: ProviderProfileInput["card"];
  replacingCard?: boolean;
}): ProviderProfileErrors {
  const errors: ProviderProfileErrors = {};
  if (!input.prescriberName.trim()) errors.prescriberName = "Name is required.";
  if (!input.practiceName.trim()) errors.practiceName = "Practice name is required.";
  if (!completeAddress(input.address)) errors.address = "Address is required.";
  if (digitsOnly(input.phone).length < 10) errors.phone = "Phone # is required.";
  if (!/^\d{10}$/.test(digitsOnly(input.npi))) errors.npi = "NPI must be 10 digits.";
  if (!input.stateLicense.trim()) errors.stateLicense = "State license is required.";
  if (!/^[A-Za-z]{2}\d{7}$/.test(normalizeDea(input.dea))) errors.dea = "DEA # must be 2 letters and 7 digits.";
  if (!input.clinicCard?.last4) {
    errors.clinicCard = "Clinic card on file is required. Clinic and patient price will be different.";
  } else if (input.replacingCard && input.cardDraft) {
    const cardError = validateCardDraft(input.cardDraft);
    if (cardError) errors.clinicCard = cardError;
  }
  return errors;
}

function validateCardDraft(card: ProviderProfileInput["card"]) {
  const number = digitsOnly(card.number);
  if (number.length < 13 || number.length > 19) return "Enter a clinic card number.";
  if (!card.nameOnCard.trim()) return "Name on the clinic card is required.";
  const month = Number(card.expMonth);
  const year = Number(normalizeYear(card.expYear));
  if (!month || month < 1 || month > 12 || Number.isNaN(year)) return "Clinic card expiration is required.";
  if (digitsOnly(card.cvc).length < 3) return "Clinic card CVC is required.";
  return "";
}

function completeAddress(address: Address) {
  return Boolean(
    address.line1.trim() &&
      address.city.trim() &&
      /^[A-Za-z]{2}$/.test(address.state.trim()) &&
      /^\d{5}(?:-?\d{4})?$/.test(address.zip.trim()),
  );
}

function normalizeDea(value: string) {
  return value.replace(/[\s-]/g, "").toUpperCase();
}

function normalizeYear(value: string) {
  const digits = digitsOnly(value);
  if (digits.length === 4) return digits.slice(-2);
  return digits.padStart(2, "0").slice(-2);
}

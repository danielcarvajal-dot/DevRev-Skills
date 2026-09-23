import { EMPTY_ADDRESS } from "./patients";
import { digitsOnly, tokenizeClinicCard } from "./provider-profile";
import type { Address, ClinicCard, Patient } from "./types";

export type PatientCardDraft = {
  nameOnCard: string;
  number: string;
  expMonth: string;
  expYear: string;
  cvc: string;
};

export type PatientProfileInput = Omit<Patient, "id" | "createdAt" | "card"> & {
  cardDraft: PatientCardDraft;
  existingCard?: ClinicCard | null;
};

export type PatientProfileErrors = Partial<
  Record<"firstName" | "lastName" | "dob" | "address" | "phone" | "allergies" | "card", string>
>;

export function emptyCardDraft(): PatientCardDraft {
  return { nameOnCard: "", number: "", expMonth: "", expYear: "", cvc: "" };
}

export function emptyPatientProfileInput(): PatientProfileInput {
  return {
    firstName: "",
    lastName: "",
    dob: "",
    sex: "unspecified",
    phone: "",
    email: "",
    address: { ...EMPTY_ADDRESS },
    allergies: "",
    clinicalNotes: "",
    weightKg: "",
    cardDraft: emptyCardDraft(),
    existingCard: null,
  };
}

export function inputFromPatient(patient: Omit<Patient, "id" | "createdAt">): PatientProfileInput {
  return {
    ...patient,
    address: { ...EMPTY_ADDRESS, ...patient.address },
    cardDraft: {
      nameOnCard: patient.card?.nameOnCard || "",
      number: "",
      expMonth: patient.card?.expMonth || "",
      expYear: patient.card?.expYear || "",
      cvc: "",
    },
    existingCard: patient.card,
  };
}

export function isCompletePatientProfile(
  patient: Pick<Patient, "firstName" | "lastName" | "dob" | "address" | "phone" | "allergies" | "card"> | null | undefined,
) {
  if (!patient) return false;
  return Object.keys(validateStoredPatient(patient)).length === 0;
}

export function validateStoredPatient(
  patient: Pick<Patient, "firstName" | "lastName" | "dob" | "address" | "phone" | "allergies" | "card">,
): PatientProfileErrors {
  return collectErrors({
    firstName: patient.firstName,
    lastName: patient.lastName,
    dob: patient.dob,
    address: patient.address || EMPTY_ADDRESS,
    phone: patient.phone,
    allergies: patient.allergies,
    card: patient.card,
  });
}

export function validatePatientProfile(input: PatientProfileInput): PatientProfileErrors {
  const replacing = digitsOnly(input.cardDraft.number).length > 0;
  const card = resolveCard(input);
  const errors = collectErrors({
    firstName: input.firstName,
    lastName: input.lastName,
    dob: input.dob,
    address: input.address,
    phone: input.phone,
    allergies: input.allergies,
    card,
  });
  if (replacing) {
    const cardError = validateCardDraft(input.cardDraft);
    if (cardError) errors.card = cardError;
  }
  return errors;
}

export function buildPatientFromProfile(input: PatientProfileInput): Omit<Patient, "id" | "createdAt"> {
  const card = resolveCard(input);
  if (!card) throw new Error("Card on file is required.");
  return {
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    dob: input.dob,
    sex: input.sex,
    phone: input.phone.trim(),
    email: input.email.trim(),
    address: {
      line1: input.address.line1.trim(),
      line2: input.address.line2.trim(),
      city: input.address.city.trim(),
      state: input.address.state.trim().toUpperCase(),
      zip: input.address.zip.trim(),
    },
    allergies: input.allergies.trim(),
    card,
    clinicalNotes: input.clinicalNotes.trim(),
    weightKg: input.weightKg.trim(),
  };
}

export function demoPatientCard(nameOnCard: string, last4 = "4242"): ClinicCard {
  return {
    nameOnCard,
    brand: "Visa",
    last4,
    expMonth: "12",
    expYear: "28",
  };
}

function resolveCard(input: PatientProfileInput): ClinicCard | null {
  if (digitsOnly(input.cardDraft.number).length >= 13) {
    return tokenizeClinicCard(input.cardDraft);
  }
  return input.existingCard || null;
}

function collectErrors(input: {
  firstName: string;
  lastName: string;
  dob: string;
  address: Address;
  phone: string;
  allergies: string;
  card: ClinicCard | null | undefined;
}): PatientProfileErrors {
  const errors: PatientProfileErrors = {};
  if (!input.firstName.trim()) errors.firstName = "First name is required.";
  if (!input.lastName.trim()) errors.lastName = "Last name is required.";
  if (!validDob(input.dob)) errors.dob = "DOB is required.";
  if (!completeAddress(input.address)) errors.address = "Address is required.";
  if (digitsOnly(input.phone).length < 10) errors.phone = "Phone # is required.";
  if (!input.allergies.trim()) errors.allergies = "Allergies are required. Enter NKDA if none are known.";
  if (!input.card?.last4) {
    errors.card = "Card on file is required. Clinic and patient price will be different.";
  }
  return errors;
}

function validateCardDraft(card: PatientCardDraft) {
  const number = digitsOnly(card.number);
  if (number.length < 13 || number.length > 19) return "Enter a card number.";
  if (!card.nameOnCard.trim()) return "Name on the card is required.";
  const month = Number(card.expMonth);
  if (!month || month < 1 || month > 12 || !digitsOnly(card.expYear)) return "Card expiration is required.";
  if (digitsOnly(card.cvc).length < 3) return "Card CVC is required.";
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

function validDob(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime()) && date.getTime() < Date.now();
}

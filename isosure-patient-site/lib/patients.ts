import type { Address, Patient, Sex } from "./types";

export const EMPTY_ADDRESS: Address = { line1: "", line2: "", city: "", state: "", zip: "" };

export function patientDisplayName(patient: Pick<Patient, "firstName" | "lastName">) {
  return `${patient.firstName} ${patient.lastName}`.trim() || "Unnamed patient";
}

export function formatDob(iso: string) {
  if (!iso) return "—";
  const [year, month, day] = iso.split("-");
  if (!year || !month || !day) return iso;
  return `${month}/${day}/${year}`;
}

export function sexLabel(sex: Sex) {
  if (sex === "female") return "Female";
  if (sex === "male") return "Male";
  if (sex === "other") return "Other";
  return "Unspecified";
}

export function searchPatients(patients: Patient[], query: string) {
  const raw = query.trim().toLowerCase();
  if (!raw) return patients;
  const digits = raw.replace(/\D/g, "");
  return patients.filter((patient) => {
    const name = patientDisplayName(patient).toLowerCase();
    const phone = patient.phone.replace(/\D/g, "");
    const email = patient.email.toLowerCase();
    const dobAlt = formatDob(patient.dob).toLowerCase();
    return (
      name.includes(raw) ||
      patient.id.toLowerCase().includes(raw) ||
      email.includes(raw) ||
      patient.dob.includes(raw) ||
      dobAlt.includes(raw) ||
      (digits.length >= 3 && (phone.includes(digits) || patient.id.replace(/\D/g, "").includes(digits)))
    );
  });
}

export function emptyPatientDraft(): Omit<Patient, "id" | "createdAt"> {
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
  };
}

export function shippingAddress(patient: Patient, practiceName: string): Address {
  if (patient.address.line1.trim()) return patient.address;
  return {
    line1: practiceName || "Practice pickup",
    line2: "",
    city: "",
    state: "",
    zip: "",
  };
}

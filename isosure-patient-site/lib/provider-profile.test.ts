import assert from "node:assert/strict";
import test from "node:test";
import { EMPTY_ADDRESS } from "./patients";
import {
  buildDoctorFromProfile,
  emptyProviderProfileInput,
  isCompleteProviderProfile,
  patientCashPrice,
  tokenizeClinicCard,
  validateProviderProfile,
} from "./provider-profile";

function validInput() {
  return {
    ...emptyProviderProfileInput(),
    prescriberName: "Hannah Kitner, NP",
    practiceName: "Hawthorne Family Medicine",
    address: { line1: "418 Hawthorne Blvd", line2: "Suite 2", city: "Portland", state: "OR", zip: "97214" },
    phone: "(503) 555-0148",
    npi: "1234567890",
    stateLicense: "OR-NP-18442",
    dea: "BK1234563",
    email: "hkitner-provider@hawthornefm.example",
    card: {
      nameOnCard: "Hannah Kitner",
      number: "4242424242424242",
      expMonth: "12",
      expYear: "28",
      cvc: "123",
    },
  };
}

test("provider profile requires name, practice, address, phone, NPI, license, DEA, and clinic card", () => {
  const blank = validateProviderProfile(emptyProviderProfileInput());
  assert.equal(blank.prescriberName, "Name is required.");
  assert.equal(blank.practiceName, "Practice name is required.");
  assert.equal(blank.address, "Address is required.");
  assert.equal(blank.phone, "Phone # is required.");
  assert.equal(blank.npi, "NPI must be 10 digits.");
  assert.equal(blank.stateLicense, "State license is required.");
  assert.equal(blank.dea, "DEA # must be 2 letters and 7 digits.");
  assert.match(blank.clinicCard || "", /Clinic card on file is required/);
  assert.deepEqual(validateProviderProfile(validInput()), {});
});

test("NPI, DEA, and address formats are checked", () => {
  const npi = validateProviderProfile({ ...validInput(), npi: "123" });
  assert.equal(npi.npi, "NPI must be 10 digits.");
  const dea = validateProviderProfile({ ...validInput(), dea: "1234567" });
  assert.equal(dea.dea, "DEA # must be 2 letters and 7 digits.");
  const address = validateProviderProfile({
    ...validInput(),
    address: { ...EMPTY_ADDRESS, line1: "1 Main", city: "Portland", state: "Oregon", zip: "97214" },
  });
  assert.equal(address.address, "Address is required.");
});

test("clinic card is tokenized and patient cash price differs from clinic price", () => {
  const card = tokenizeClinicCard({
    nameOnCard: "Hannah Kitner",
    number: "4242 4242 4242 4242",
    expMonth: "12",
    expYear: "2028",
  });
  assert.equal(card.brand, "Visa");
  assert.equal(card.last4, "4242");
  assert.equal(card.expYear, "28");
  assert.equal(patientCashPrice(50), 60);
});

test("a complete profile can be saved; missing clinic card cannot", () => {
  const doctor = buildDoctorFromProfile(validInput());
  assert.equal(doctor.npi, "1234567890");
  assert.equal(doctor.clinicCard?.last4, "4242");
  assert.equal(isCompleteProviderProfile(doctor), true);
  assert.equal(
    isCompleteProviderProfile({
      ...doctor,
      clinicCard: null,
    }),
    false,
  );
});

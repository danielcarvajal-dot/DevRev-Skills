import assert from "node:assert/strict";
import test from "node:test";
import { EMPTY_ADDRESS } from "./patients";
import {
  buildPatientFromProfile,
  emptyPatientProfileInput,
  isCompletePatientProfile,
  validatePatientProfile,
} from "./patient-profile";

function validInput() {
  return {
    ...emptyPatientProfileInput(),
    firstName: "Avery",
    lastName: "Nguyen",
    dob: "1986-04-12",
    phone: "(503) 555-0112",
    address: { line1: "88 Division St", line2: "", city: "Portland", state: "OR", zip: "97214" },
    allergies: "Penicillin",
    cardDraft: {
      nameOnCard: "Avery Nguyen",
      number: "4242424242424242",
      expMonth: "12",
      expYear: "28",
      cvc: "123",
    },
  };
}

test("patient profile requires first/last name, DOB, address, phone, allergies, and a card", () => {
  const blank = validatePatientProfile(emptyPatientProfileInput());
  assert.equal(blank.firstName, "First name is required.");
  assert.equal(blank.lastName, "Last name is required.");
  assert.equal(blank.dob, "DOB is required.");
  assert.equal(blank.address, "Address is required.");
  assert.equal(blank.phone, "Phone # is required.");
  assert.match(blank.allergies || "", /Allergies are required/);
  assert.match(blank.card || "", /Card on file is required/);
  assert.deepEqual(validatePatientProfile(validInput()), {});
});

test("NKDA counts as allergies; a missing card does not", () => {
  const nkda = validatePatientProfile({ ...validInput(), allergies: "NKDA" });
  assert.equal(nkda.allergies, undefined);
  const saved = buildPatientFromProfile(validInput());
  assert.equal(saved.card?.last4, "4242");
  assert.equal(isCompletePatientProfile(saved), true);
  assert.equal(isCompletePatientProfile({ ...saved, card: null }), false);
  assert.equal(
    isCompletePatientProfile({
      ...saved,
      address: EMPTY_ADDRESS,
    }),
    false,
  );
});

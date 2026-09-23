"use client";

import { useState } from "react";
import {
  buildPatientFromProfile,
  emptyPatientProfileInput,
  inputFromPatient,
  validatePatientProfile,
  type PatientProfileInput,
} from "@/lib/patient-profile";
import { formatClinicCard } from "@/lib/provider-profile";
import type { Patient } from "@/lib/types";

type Props = {
  existing?: Omit<Patient, "id" | "createdAt"> | null;
  submitLabel?: string;
  onSave: (patient: Omit<Patient, "id" | "createdAt">) => void;
};

export function PatientProfileForm({ existing, submitLabel = "Save patient", onSave }: Props) {
  const [input, setInput] = useState<PatientProfileInput>(() =>
    existing ? inputFromPatient(existing) : emptyPatientProfileInput(),
  );
  const [errors, setErrors] = useState<ReturnType<typeof validatePatientProfile>>({});
  const field = "mt-1 w-full rounded-lg border border-line px-3 py-2";

  function setField<K extends keyof PatientProfileInput>(key: K, value: PatientProfileInput[K]) {
    setInput((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors = validatePatientProfile(input);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    onSave(buildPatientFromProfile(input));
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="First name" error={errors.firstName}>
          <input
            required
            className={field}
            value={input.firstName}
            onChange={(e) => setField("firstName", e.target.value)}
            placeholder="Avery"
          />
        </Field>
        <Field label="Last name" error={errors.lastName}>
          <input
            required
            className={field}
            value={input.lastName}
            onChange={(e) => setField("lastName", e.target.value)}
            placeholder="Nguyen"
          />
        </Field>
        <Field label="DOB" error={errors.dob}>
          <input
            required
            type="date"
            className={field}
            value={input.dob}
            onChange={(e) => setField("dob", e.target.value)}
          />
        </Field>
        <label className="block text-sm">
          Sex
          <select
            className={field}
            value={input.sex}
            onChange={(e) => setField("sex", e.target.value as PatientProfileInput["sex"])}
          >
            <option value="unspecified">Unspecified</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
          </select>
        </label>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Address</legend>
        <input
          required
          className={field}
          placeholder="Street address"
          value={input.address.line1}
          onChange={(e) => setField("address", { ...input.address, line1: e.target.value })}
        />
        <input
          className={field}
          placeholder="Suite / unit (optional)"
          value={input.address.line2}
          onChange={(e) => setField("address", { ...input.address, line2: e.target.value })}
        />
        <div className="grid gap-2 sm:grid-cols-[1fr_80px_120px]">
          <input
            required
            className={field}
            placeholder="City"
            value={input.address.city}
            onChange={(e) => setField("address", { ...input.address, city: e.target.value })}
          />
          <input
            required
            className={field}
            placeholder="ST"
            maxLength={2}
            value={input.address.state}
            onChange={(e) => setField("address", { ...input.address, state: e.target.value.toUpperCase() })}
          />
          <input
            required
            className={field}
            placeholder="ZIP"
            value={input.address.zip}
            onChange={(e) => setField("address", { ...input.address, zip: e.target.value })}
          />
        </div>
        {errors.address ? <p className="text-sm text-danger">{errors.address}</p> : null}
      </fieldset>

      <Field label="Phone #" error={errors.phone}>
        <input
          required
          type="tel"
          className={field}
          placeholder="(503) 555-0112"
          value={input.phone}
          onChange={(e) => setField("phone", e.target.value)}
        />
      </Field>
      <Field label="Allergies" error={errors.allergies}>
        <textarea
          required
          className={field}
          rows={2}
          placeholder="Penicillin, or NKDA if none"
          value={input.allergies}
          onChange={(e) => setField("allergies", e.target.value)}
        />
      </Field>
      <label className="block text-sm">
        Email
        <input
          type="email"
          className={field}
          placeholder="optional"
          value={input.email}
          onChange={(e) => setField("email", e.target.value)}
        />
      </label>

      <fieldset className="space-y-2 rounded-xl border border-line p-4">
        <legend className="px-1 text-sm font-semibold">Card on file</legend>
        <p className="text-sm text-ink-soft">
          Clinic and patient price will be different. This card is charged the patient cash price.
        </p>
        {input.existingCard ? <p className="text-sm">On file: {formatClinicCard(input.existingCard)}</p> : null}
        <Field label="Name on card" error={undefined}>
          <input
            className={field}
            required={!input.existingCard}
            placeholder="Avery Nguyen"
            value={input.cardDraft.nameOnCard}
            onChange={(e) => setField("cardDraft", { ...input.cardDraft, nameOnCard: e.target.value })}
          />
        </Field>
        <Field label={input.existingCard ? "Card number (leave blank to keep the card on file)" : "Card number"} error={undefined}>
          <input
            className={field}
            required={!input.existingCard}
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="4242 4242 4242 4242"
            value={input.cardDraft.number}
            onChange={(e) => setField("cardDraft", { ...input.cardDraft, number: e.target.value })}
          />
        </Field>
        <div className="grid gap-2 sm:grid-cols-3">
          <label className="block text-sm">
            Exp. month
            <input
              className={field}
              required={!input.existingCard}
              inputMode="numeric"
              maxLength={2}
              placeholder="12"
              value={input.cardDraft.expMonth}
              onChange={(e) =>
                setField("cardDraft", { ...input.cardDraft, expMonth: e.target.value.replace(/\D/g, "").slice(0, 2) })
              }
            />
          </label>
          <label className="block text-sm">
            Exp. year
            <input
              className={field}
              required={!input.existingCard}
              inputMode="numeric"
              maxLength={4}
              placeholder="28"
              value={input.cardDraft.expYear}
              onChange={(e) =>
                setField("cardDraft", { ...input.cardDraft, expYear: e.target.value.replace(/\D/g, "").slice(0, 4) })
              }
            />
          </label>
          <label className="block text-sm">
            CVC
            <input
              className={field}
              required={!input.existingCard}
              inputMode="numeric"
              maxLength={4}
              placeholder="123"
              value={input.cardDraft.cvc}
              onChange={(e) =>
                setField("cardDraft", { ...input.cardDraft, cvc: e.target.value.replace(/\D/g, "").slice(0, 4) })
              }
            />
          </label>
        </div>
        {errors.card ? <p className="text-sm text-danger">{errors.card}</p> : null}
      </fieldset>

      <button type="submit" className="rounded-lg bg-purple-deep px-4 py-2 text-sm font-semibold text-white">
        {submitLabel}
      </button>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm">
      {label}
      {children}
      {error ? <p className="mt-1 text-sm text-danger">{error}</p> : null}
    </label>
  );
}

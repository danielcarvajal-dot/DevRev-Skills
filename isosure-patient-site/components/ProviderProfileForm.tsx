"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  buildDoctorFromProfile,
  emptyProviderProfileInput,
  formatClinicCard,
  inputFromDoctor,
  validateProviderProfile,
} from "@/lib/provider-profile";
import { useStore } from "@/lib/store";
import type { Doctor, ProviderLoginKind } from "@/lib/types";

type Props = {
  existing?: Doctor | null;
};

export function ProviderProfileForm({ existing }: Props) {
  const router = useRouter();
  const { signInDoctor, updateProviderProfile } = useStore();
  const [input, setInput] = useState(() => (existing ? inputFromDoctor(existing) : emptyProviderProfileInput()));
  const [errors, setErrors] = useState<ReturnType<typeof validateProviderProfile>>({});

  function setField<K extends keyof typeof input>(key: K, value: (typeof input)[K]) {
    setInput((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors = validateProviderProfile(input);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    const profile = buildDoctorFromProfile(input);
    if (existing) {
      updateProviderProfile(profile);
    } else {
      signInDoctor(profile);
    }
    router.push("/account");
  }

  const field = "mt-1 w-full rounded-lg border border-line px-3 py-2";
  const editing = Boolean(existing);

  return (
    <form className="space-y-5 rounded-2xl border border-line bg-paper p-6" onSubmit={submit}>
      <div className="flex flex-wrap gap-4 text-sm">
        {(["prescriber", "facility"] as ProviderLoginKind[]).map((kind) => (
          <label key={kind} className="inline-flex items-center gap-2">
            <input
              type="radio"
              checked={input.loginKind === kind}
              onChange={() => setField("loginKind", kind)}
            />
            {kind === "prescriber" ? "Prescriber" : "Facility"}
          </label>
        ))}
      </div>

      <Field label="Name" error={errors.prescriberName}>
        <input
          required
          className={field}
          value={input.prescriberName}
          onChange={(e) => setField("prescriberName", e.target.value)}
          placeholder="Hannah Kitner, NP"
        />
      </Field>
      <Field label="Practice name" error={errors.practiceName}>
        <input
          required
          className={field}
          value={input.practiceName}
          onChange={(e) => setField("practiceName", e.target.value)}
          placeholder="Hawthorne Family Medicine"
        />
      </Field>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Address</legend>
        <input
          required
          className={field}
          value={input.address.line1}
          onChange={(e) => setField("address", { ...input.address, line1: e.target.value })}
          placeholder="Street address"
        />
        <input
          className={field}
          value={input.address.line2}
          onChange={(e) => setField("address", { ...input.address, line2: e.target.value })}
          placeholder="Suite / unit (optional)"
        />
        <div className="grid gap-2 sm:grid-cols-[1fr_80px_120px]">
          <input
            required
            className={field}
            value={input.address.city}
            onChange={(e) => setField("address", { ...input.address, city: e.target.value })}
            placeholder="City"
          />
          <input
            required
            className={field}
            value={input.address.state}
            onChange={(e) => setField("address", { ...input.address, state: e.target.value.toUpperCase() })}
            placeholder="ST"
            maxLength={2}
          />
          <input
            required
            className={field}
            value={input.address.zip}
            onChange={(e) => setField("address", { ...input.address, zip: e.target.value })}
            placeholder="ZIP"
          />
        </div>
        {errors.address ? <p className="text-sm text-danger">{errors.address}</p> : null}
      </fieldset>
      <Field label="Phone #" error={errors.phone}>
        <input
          required
          type="tel"
          className={field}
          value={input.phone}
          onChange={(e) => setField("phone", e.target.value)}
          placeholder="(503) 555-0148"
        />
      </Field>
      <Field label="NPI" error={errors.npi}>
        <input
          required
          inputMode="numeric"
          maxLength={10}
          className={field}
          value={input.npi}
          onChange={(e) => setField("npi", e.target.value.replace(/\D/g, "").slice(0, 10))}
          placeholder="1234567890"
        />
      </Field>
      <Field label="State license" error={errors.stateLicense}>
        <input
          required
          className={field}
          value={input.stateLicense}
          onChange={(e) => setField("stateLicense", e.target.value)}
          placeholder="OR-NP-18442"
        />
      </Field>
      <Field label="DEA #" error={errors.dea}>
        <input
          required
          className={field}
          value={input.dea}
          onChange={(e) => setField("dea", e.target.value.toUpperCase())}
          placeholder="BK1234563"
        />
      </Field>
      <label className="block text-sm">
        Office email
        <input
          type="email"
          className={field}
          value={input.email}
          onChange={(e) => setField("email", e.target.value)}
          placeholder="orders@practice.example"
        />
      </label>

      <fieldset className="space-y-2 rounded-xl border border-line p-4">
        <legend className="px-1 text-sm font-semibold">Clinic card on file</legend>
        <p className="text-sm text-ink-soft">
          Clinic and patient price will be different. The clinic card is billed the clinic rate;
          patients are charged the cash price separately.
        </p>
        {editing && input.existingCard ? (
          <p className="text-sm">On file: {formatClinicCard(input.existingCard)}</p>
        ) : null}
        <Field label="Name on card" error={undefined}>
          <input
            className={field}
            value={input.card.nameOnCard}
            onChange={(e) => setField("card", { ...input.card, nameOnCard: e.target.value })}
            placeholder="Hannah Kitner"
            required={!input.existingCard}
          />
        </Field>
        <Field label={editing ? "Card number (leave blank to keep the card on file)" : "Card number"} error={undefined}>
          <input
            className={field}
            inputMode="numeric"
            autoComplete="cc-number"
            value={input.card.number}
            onChange={(e) => setField("card", { ...input.card, number: e.target.value })}
            placeholder="4242 4242 4242 4242"
            required={!input.existingCard}
          />
        </Field>
        <div className="grid gap-2 sm:grid-cols-3">
          <label className="block text-sm">
            Exp. month
            <input
              className={field}
              inputMode="numeric"
              maxLength={2}
              value={input.card.expMonth}
              onChange={(e) => setField("card", { ...input.card, expMonth: e.target.value.replace(/\D/g, "").slice(0, 2) })}
              placeholder="12"
              required={!input.existingCard}
            />
          </label>
          <label className="block text-sm">
            Exp. year
            <input
              className={field}
              inputMode="numeric"
              maxLength={4}
              value={input.card.expYear}
              onChange={(e) => setField("card", { ...input.card, expYear: e.target.value.replace(/\D/g, "").slice(0, 4) })}
              placeholder="28"
              required={!input.existingCard}
            />
          </label>
          <label className="block text-sm">
            CVC
            <input
              className={field}
              inputMode="numeric"
              maxLength={4}
              value={input.card.cvc}
              onChange={(e) => setField("card", { ...input.card, cvc: e.target.value.replace(/\D/g, "").slice(0, 4) })}
              placeholder="123"
              required={!input.existingCard}
            />
          </label>
        </div>
        {errors.clinicCard ? <p className="text-sm text-danger">{errors.clinicCard}</p> : null}
      </fieldset>

      <button type="submit" className="w-full rounded-lg bg-purple-deep py-2.5 text-sm font-semibold text-white">
        {editing ? "Save provider profile" : "Create provider profile"}
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

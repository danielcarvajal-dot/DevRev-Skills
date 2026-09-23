"use client";

import { useState } from "react";
import Link from "next/link";
import { PatientProfileForm } from "@/components/PatientProfileForm";
import { canAccessProvider } from "@/lib/auth";
import { formatDob, patientDisplayName, searchPatients } from "@/lib/patients";
import { formatClinicCard } from "@/lib/provider-profile";
import { useStore } from "@/lib/store";

export default function PatientsPage() {
  const { user, ready, patients, upsertPatient } = useStore();
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const matches = searchPatients(patients, query);

  if (!ready) {
    return <div className="mx-auto max-w-5xl px-4 py-16 text-ink-soft">Loading patients…</div>;
  }
  if (!user || !canAccessProvider(user)) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-semibold">Provider login required</h1>
        <Link href="/login" className="mt-5 inline-block rounded-lg bg-purple-deep px-5 py-2.5 text-sm font-semibold text-white">
          Main login
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-mid">Provider portal</p>
          <h1 className="mt-2 text-3xl font-semibold">Patients</h1>
          <p className="mt-2 text-sm text-ink-soft">
            First and last name, DOB, address, phone, allergies, and a card on file are required.
            Clinic and patient price will be different.
          </p>
        </div>
        <Link href="/order/new" className="rounded-lg bg-purple-deep px-4 py-2 text-sm font-semibold text-white">
          + New medication order
        </Link>
      </div>
      <input
        className="w-full rounded-lg border border-line px-3 py-2"
        placeholder="Name, DOB, patient ID, or phone"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-paper">
        {matches.map((patient) => (
          <li key={patient.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div>
              <p className="font-semibold">{patientDisplayName(patient)}</p>
              <p className="text-sm text-ink-soft">
                DOB {formatDob(patient.dob)} · {patient.phone || "No phone"} · {patient.allergies || "No allergies listed"} ·{" "}
                {formatClinicCard(patient.card)}
              </p>
            </div>
            <Link href={`/order/new?patient=${patient.id}`} className="text-sm underline underline-offset-4">
              Order for this patient
            </Link>
          </li>
        ))}
      </ul>
      <button type="button" className="rounded-lg border border-line px-4 py-2 text-sm" onClick={() => setAdding((open) => !open)}>
        + Add new patient
      </button>
      {adding ? (
        <div className="rounded-xl border border-line bg-paper p-4">
          <PatientProfileForm
            submitLabel="Save patient"
            onSave={(profile) => {
              upsertPatient({ ...profile, id: crypto.randomUUID(), createdAt: new Date().toISOString() });
              setAdding(false);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

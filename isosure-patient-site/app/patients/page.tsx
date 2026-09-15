"use client";

import { useState } from "react";
import Link from "next/link";
import { emptyPatientDraft, formatDob, patientDisplayName, searchPatients } from "@/lib/patients";
import { useStore } from "@/lib/store";
import type { Sex } from "@/lib/types";

export default function PatientsPage() {
  const { user, ready, patients, upsertPatient } = useStore();
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(emptyPatientDraft());
  const matches = searchPatients(patients, query);

  if (!ready) {
    return <div className="mx-auto max-w-5xl px-4 py-16 text-ink-soft">Loading patients…</div>;
  }
  if (!user || user.role !== "doctor") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-semibold">Provider login required</h1>
        <Link href="/login" className="mt-5 inline-block rounded-lg bg-purple-deep px-5 py-2.5 text-sm font-semibold text-white">
          Sign in
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
          <p className="mt-2 text-sm text-ink-soft">Search first. Add only the details you need to start an order.</p>
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
                DOB {formatDob(patient.dob)} · {patient.phone || "No phone"} · ID {patient.id.slice(-6).toUpperCase()}
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
        <form
          className="space-y-3 rounded-xl border border-line bg-paper p-4"
          onSubmit={(e) => {
            e.preventDefault();
            upsertPatient({ ...draft, id: crypto.randomUUID(), createdAt: new Date().toISOString() });
            setDraft(emptyPatientDraft());
            setAdding(false);
          }}
        >
          <div className="grid gap-2 sm:grid-cols-2">
            <input required className="rounded-lg border border-line px-3 py-2" placeholder="First name" value={draft.firstName} onChange={(e) => setDraft({ ...draft, firstName: e.target.value })} />
            <input required className="rounded-lg border border-line px-3 py-2" placeholder="Last name" value={draft.lastName} onChange={(e) => setDraft({ ...draft, lastName: e.target.value })} />
            <input required type="date" className="rounded-lg border border-line px-3 py-2" value={draft.dob} onChange={(e) => setDraft({ ...draft, dob: e.target.value })} />
            <select className="rounded-lg border border-line px-3 py-2" value={draft.sex} onChange={(e) => setDraft({ ...draft, sex: e.target.value as Sex })}>
              <option value="unspecified">Sex (optional)</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
            <input className="rounded-lg border border-line px-3 py-2" placeholder="Phone" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
            <input className="rounded-lg border border-line px-3 py-2" placeholder="Email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
          </div>
          <button type="submit" className="rounded-lg bg-purple-deep px-4 py-2 text-sm font-semibold text-white">
            Save patient
          </button>
        </form>
      ) : null}
    </div>
  );
}

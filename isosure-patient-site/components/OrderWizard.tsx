"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormulaPicker } from "@/components/FormulaPicker";
import { PatientProfileForm } from "@/components/PatientProfileForm";
import { canAccessProvider, providerIdentity } from "@/lib/auth";
import { formulaByProductId, formulaForProduct, formulasFrom } from "@/lib/formulas";
import { isCompletePatientProfile } from "@/lib/patient-profile";
import { formatClinicCard, isCompleteProviderProfile } from "@/lib/provider-profile";
import { canSubmitOrder, evaluateOrderAlerts } from "@/lib/order-alerts";
import { fieldsForWorkflow, orderableMeta } from "@/lib/orderables";
import {
  formatDob,
  patientDisplayName,
  searchPatients,
  sexLabel,
} from "@/lib/patients";
import { useStore } from "@/lib/store";
import type { Patient, Prescription } from "@/lib/types";

type Step = "patient" | "medication" | "prescription" | "review";

const STEPS: { id: Step; label: string }[] = [
  { id: "patient", label: "Patient" },
  { id: "medication", label: "Medication" },
  { id: "prescription", label: "Prescription" },
  { id: "review", label: "Review" },
];

const emptyRx: Partial<Prescription> = {
  productId: "",
  doseId: "",
  directions: "",
  quantity: undefined,
  quantityUnit: "",
  refills: 0,
  daw: false,
  notes: "",
  doseAmount: "",
  volumeMl: "",
};

export function OrderWizard() {
  const router = useRouter();
  const params = useSearchParams();
  const {
    user,
    ready,
    patients,
    products,
    orders,
    drafts,
    upsertPatient,
    saveDraft,
    submitMedicationOrder,
  } = useStore();

  const [step, setStep] = useState<Step>("patient");
  const draftParam = params.get("draft");
  const [draftId] = useState(() => draftParam || crypto.randomUUID());
  const [patientId, setPatientId] = useState<string | null>(params.get("patient"));
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [category, setCategory] = useState("Hormones");
  const [medication, setMedication] = useState("");
  const [showIngredients, setShowIngredients] = useState(false);
  const [rx, setRx] = useState<Partial<Prescription>>(emptyRx);
  const [ack, setAck] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [hydratedDraft, setHydratedDraft] = useState<string | null>(null);

  const existingDraft = ready ? drafts.find((item) => item.id === draftParam) : undefined;
  if (existingDraft && hydratedDraft !== existingDraft.id) {
    setHydratedDraft(existingDraft.id);
    setPatientId(existingDraft.patientId);
    setRx({ ...emptyRx, ...existingDraft.prescription });
    setAck(existingDraft.acknowledgedAlertIds);
    if (existingDraft.prescription.productId) {
      const nextProduct = products.find((item) => item.id === existingDraft.prescription.productId);
      if (nextProduct) {
        const formula = formulaForProduct(nextProduct);
        setCategory(formula.category);
        setMedication(formula.medication);
      }
      setStep("prescription");
    }
  }

  const patient = patients.find((item) => item.id === patientId) || null;
  const product = products.find((item) => item.id === rx.productId) || null;
  const dose = product?.doses.find((item) => item.id === rx.doseId) || null;
  const meta = product ? orderableMeta(product) : null;

  const matches = searchPatients(patients, query);
  const formulas = formulasFrom(products);
  const selectedFormula = formulaByProductId(formulas, rx.productId);
  const alerts = evaluateOrderAlerts({ patient, product, dose, prescription: rx, orders });

  function persistDraft() {
    saveDraft({
      id: draftId,
      patientId,
      prescription: rx,
      acknowledgedAlertIds: ack,
      updatedAt: new Date().toISOString(),
    });
  }

  function applyProduct(nextProductId: string, nextDoseId?: string) {
    const next = products.find((item) => item.id === nextProductId);
    if (!next) return;
    const info = orderableMeta(next);
    const nextDose = next.doses.find((item) => item.id === nextDoseId) || next.doses[0];
    const formula = formulaForProduct(next);
    setCategory(formula.category);
    setMedication(formula.medication);
    setRx((prev) => ({
      ...prev,
      productId: next.id,
      doseId: nextDose?.id || "",
      directions: prev.directions || info.defaultDirections,
      quantity: prev.quantity ?? info.defaultQuantity,
      quantityUnit: info.quantityUnit,
      refills: prev.refills ?? 0,
      daw: prev.daw ?? false,
      notes: prev.notes || "",
      doseAmount: info.workflowKind === "injection" ? prev.doseAmount || "" : "",
      volumeMl: info.workflowKind === "injection" ? prev.volumeMl || "" : "",
    }));
    setAck([]);
  }

  function chooseCategory(nextCategory: string) {
    setCategory(nextCategory);
    setMedication("");
    setShowIngredients(false);
    setRx((prev) => ({ ...emptyRx, notes: prev.notes, refills: prev.refills, daw: prev.daw }));
    setAck([]);
  }

  function chooseMedication(nextMedication: string) {
    setMedication(nextMedication);
    setShowIngredients(false);
    const matches = formulas.filter((item) => item.category === category && item.medication === nextMedication);
    if (matches.length === 1) {
      applyProduct(matches[0]!.productId);
      return;
    }
    setRx((prev) => ({ ...emptyRx, notes: prev.notes, refills: prev.refills, daw: prev.daw }));
    setAck([]);
  }

  function savePatientEdits(patch: Partial<Patient>) {
    if (!patient) return;
    upsertPatient({ ...patient, ...patch, address: { ...patient.address, ...(patch.address || {}) } });
  }

  function createPatient(profile: Omit<Patient, "id" | "createdAt">) {
    const created = upsertPatient({
      ...profile,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    });
    setPatientId(created.id);
    setAdding(false);
    setError("");
  }

  function goNext() {
    persistDraft();
    setError("");
    if (step === "patient") {
      if (!patient) {
        setError("Select or add a patient to continue.");
        return;
      }
      if (!isCompletePatientProfile(patient)) {
        setError("Complete the patient profile: name, DOB, address, phone, allergies, and a card on file.");
        return;
      }
      setStep("medication");
      return;
    }
    if (step === "medication") {
      if (!product || !dose) {
        setError("Choose a medication and strength.");
        return;
      }
      setStep("prescription");
      return;
    }
    if (step === "prescription") {
      setStep("review");
    }
  }

  function submit() {
    if (!patient || !rx.productId || !rx.doseId) {
      setError("Complete the patient and medication steps first.");
      return;
    }
    if (!canSubmitOrder(alerts, ack)) {
      setError("Resolve required fields and acknowledge warnings before submitting.");
      return;
    }
    const result = submitMedicationOrder({
      patientId: patient.id,
      prescription: {
        productId: rx.productId,
        doseId: rx.doseId,
        directions: String(rx.directions || ""),
        quantity: Number(rx.quantity) || 0,
        quantityUnit: String(rx.quantityUnit || meta?.quantityUnit || ""),
        refills: Number(rx.refills) || 0,
        daw: Boolean(rx.daw),
        notes: String(rx.notes || ""),
        doseAmount: String(rx.doseAmount || ""),
        volumeMl: String(rx.volumeMl || ""),
      },
      acknowledgedAlertIds: ack,
      draftId,
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push(`/order/${result.order.id}`);
  }

  const rxFields = meta ? fieldsForWorkflow(meta.workflowKind) : [];

  if (!ready) {
    return <div className="mx-auto max-w-5xl px-4 py-16 text-ink-soft">Loading order…</div>;
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
  if (user.role === "doctor" && !isCompleteProviderProfile(user)) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-semibold">Complete your provider profile</h1>
        <p className="mt-2 text-ink-soft">
          A clinic card on file is required. Clinic and patient price will be different.
        </p>
        <Link href="/provider/register" className="mt-5 inline-block rounded-lg bg-purple-deep px-5 py-2.5 text-sm font-semibold text-white">
          Complete profile
        </Link>
      </div>
    );
  }
  const identity = providerIdentity(user);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-mid">New medication order</p>
        <h1 className="mt-2 text-3xl font-semibold">Start with the patient, then the medication</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Choose a category to see every medication in that list, then pick the formulation and the strengths this pharmacy currently offers.
        </p>
      </div>

      <ol className="flex flex-wrap gap-2 text-sm">
        {STEPS.map((item, index) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => {
                persistDraft();
                setStep(item.id);
              }}
              className={`rounded-full px-3 py-1 ${
                step === item.id ? "bg-purple-deep text-white" : "border border-line bg-paper"
              }`}
            >
              {index + 1}. {item.label}
            </button>
          </li>
        ))}
      </ol>

      {error ? <p className="rounded-lg border border-danger/30 bg-white px-3 py-2 text-sm text-danger">{error}</p> : null}

      {step === "patient" ? (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Select patient</h2>
          {patient ? (
            <article className="rounded-xl border border-line bg-paper p-4">
              <p className="text-lg font-semibold">✓ {patientDisplayName(patient)}</p>
              <p className="text-sm text-ink-soft">DOB: {formatDob(patient.dob)}</p>
              <p className="text-sm text-ink-soft">
                {sexLabel(patient.sex)}
                {patient.phone ? ` · ${patient.phone}` : ""}
                {patient.allergies ? ` · Allergies: ${patient.allergies}` : ""}
              </p>
              <p className="text-sm text-ink-soft">{formatClinicCard(patient.card)}. Clinic and patient price will be different.</p>
              <button type="button" className="mt-3 text-sm underline underline-offset-4" onClick={() => setPatientId(null)}>
                Change patient
              </button>
              <div className="mt-4 space-y-2">
                <p className="text-sm font-semibold">Required profile</p>
                <label className="block text-sm">
                  Allergies
                  <textarea
                    required
                    className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm"
                    rows={2}
                    value={patient.allergies}
                    onChange={(e) => savePatientEdits({ allergies: e.target.value })}
                    placeholder="e.g. penicillin, or NKDA"
                  />
                </label>
                <label className="block text-sm">
                  Phone #
                  <input className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm" placeholder="Phone" value={patient.phone} onChange={(e) => savePatientEdits({ phone: e.target.value })} />
                </label>
                <fieldset className="space-y-2">
                  <legend className="text-sm">Address</legend>
                  <input className="w-full rounded-lg border border-line px-3 py-2 text-sm" placeholder="Address" value={patient.address.line1} onChange={(e) => savePatientEdits({ address: { ...patient.address, line1: e.target.value } })} />
                  <div className="grid gap-2 sm:grid-cols-3">
                    <input className="rounded-lg border border-line px-3 py-2 text-sm" placeholder="City" value={patient.address.city} onChange={(e) => savePatientEdits({ address: { ...patient.address, city: e.target.value } })} />
                    <input className="rounded-lg border border-line px-3 py-2 text-sm" placeholder="ST" value={patient.address.state} onChange={(e) => savePatientEdits({ address: { ...patient.address, state: e.target.value } })} />
                    <input className="rounded-lg border border-line px-3 py-2 text-sm" placeholder="ZIP" value={patient.address.zip} onChange={(e) => savePatientEdits({ address: { ...patient.address, zip: e.target.value } })} />
                  </div>
                </fieldset>
                <details className="rounded-lg border border-line px-3 py-2">
                  <summary className="cursor-pointer text-sm">Email</summary>
                  <input className="mt-2 w-full rounded-lg border border-line px-3 py-2 text-sm" placeholder="Email" value={patient.email} onChange={(e) => savePatientEdits({ email: e.target.value })} />
                </details>
                <details className="rounded-lg border border-line px-3 py-2">
                  <summary className="cursor-pointer text-sm">Relevant clinical information</summary>
                  <div className="mt-2 grid gap-2">
                    <input className="rounded-lg border border-line px-3 py-2 text-sm" placeholder="Weight (kg) — required for some injections" value={patient.weightKg} onChange={(e) => savePatientEdits({ weightKg: e.target.value })} />
                    <textarea className="rounded-lg border border-line px-3 py-2 text-sm" rows={2} placeholder="Clinical notes" value={patient.clinicalNotes} onChange={(e) => savePatientEdits({ clinicalNotes: e.target.value })} />
                  </div>
                </details>
              </div>
            </article>
          ) : (
            <>
              <label className="block text-sm">
                Search existing patient
                <input
                  className="mt-1 w-full rounded-lg border border-line px-3 py-2"
                  placeholder="Name, DOB, patient ID, or phone"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
              <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-paper">
                {matches.length === 0 ? (
                  <li className="px-4 py-3 text-sm text-ink-soft">No matching patients.</li>
                ) : (
                  matches.map((item) => (
                    <li key={item.id}>
                      <button type="button" className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left hover:bg-purple-soft/40" onClick={() => setPatientId(item.id)}>
                        <span>
                          <span className="font-semibold">{patientDisplayName(item)}</span>
                          <span className="block text-sm text-ink-soft">
                            DOB {formatDob(item.dob)} · {item.phone || "No phone"} · ID {item.id.slice(-6).toUpperCase()}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
              <button type="button" className="rounded-lg border border-line px-4 py-2 text-sm font-semibold" onClick={() => setAdding((open) => !open)}>
                + Add new patient
              </button>
              {adding ? (
                <div className="rounded-xl border border-line bg-paper p-4">
                  <p className="mb-3 text-sm text-ink-soft">
                    First/last name, DOB, address, phone, allergies, and a card on file are required.
                    Clinic and patient price will be different.
                  </p>
                  <PatientProfileForm submitLabel="Save patient" onSave={createPatient} />
                </div>
              ) : null}
            </>
          )}
        </section>
      ) : null}

      {step === "medication" ? (
        <FormulaPicker
          formulas={formulas}
          category={category}
          medication={medication}
          selected={selectedFormula}
          doseId={rx.doseId || ""}
          showIngredients={showIngredients}
          onCategory={chooseCategory}
          onMedication={chooseMedication}
          onFormulation={(productId) => applyProduct(productId)}
          onStrength={(nextDoseId) => {
            if (product) applyProduct(product.id, nextDoseId);
          }}
          onToggleIngredients={() => setShowIngredients((open) => !open)}
        />
      ) : null}

      {step === "prescription" && product && dose && meta ? (
        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-xl border border-line bg-paper p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-purple-mid">Formula</p>
            <h2 className="mt-1 text-xl font-semibold">What the pharmacy is making</h2>
            <dl className="mt-3 space-y-1 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-ink-soft">Category</dt><dd>{selectedFormula?.category || product.category}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-ink-soft">Medication</dt><dd>{selectedFormula?.medication || meta.family}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-ink-soft">Formulation</dt><dd>{selectedFormula?.formulation || product.shortName}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-ink-soft">Strength</dt><dd>{dose.strength}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-ink-soft">Dosage form</dt><dd>{selectedFormula?.dosageForm || product.form}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-ink-soft">Route</dt><dd>{selectedFormula?.route || "—"}</dd></div>
            </dl>
            {selectedFormula ? (
              <details className="mt-3 rounded-lg border border-line bg-bg px-3 py-2 text-sm">
                <summary className="cursor-pointer font-semibold">See ingredients inside this formula</summary>
                <ul className="mt-2 space-y-1">
                  {selectedFormula.ingredients.map((item) => (
                    <li key={`${item.role}-${item.name}`} className="flex justify-between gap-3">
                      <span>{item.name}</span>
                      <span className="text-ink-soft">{item.role}</span>
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
          </article>
          <article className="space-y-3 rounded-xl border border-line bg-paper p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-purple-mid">Prescription</p>
            <h2 className="mt-1 text-xl font-semibold">What you are ordering for this patient</h2>
            <p className="text-sm">
              {product.shortName} · {dose.label}
            </p>
            {rxFields.includes("doseAmount") ? (
              <div className="rounded-lg border border-line bg-bg p-3">
                <p className="text-sm font-semibold">Injection details</p>
                <p className="mb-2 text-xs text-ink-soft">Enter the prescribed dose and volume for this formula.</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="text-sm">
                    Dose (mg)
                    <input className="mt-1 w-full rounded-lg border border-line px-3 py-2" value={rx.doseAmount || ""} onChange={(e) => setRx({ ...rx, doseAmount: e.target.value })} />
                  </label>
                  <label className="text-sm">
                    Volume (mL)
                    <input className="mt-1 w-full rounded-lg border border-line px-3 py-2" value={rx.volumeMl || ""} onChange={(e) => setRx({ ...rx, volumeMl: e.target.value })} />
                  </label>
                </div>
              </div>
            ) : null}
            <label className="block text-sm">
              Directions
              <textarea className="mt-1 w-full rounded-lg border border-line px-3 py-2" rows={2} value={rx.directions || ""} onChange={(e) => setRx({ ...rx, directions: e.target.value })} />
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="text-sm">
                Quantity ({meta.quantityUnit})
                <input type="number" min={1} className="mt-1 w-full rounded-lg border border-line px-3 py-2" value={rx.quantity ?? ""} onChange={(e) => setRx({ ...rx, quantity: Number(e.target.value) })} />
              </label>
              <label className="text-sm">
                Refills
                <input type="number" min={0} className="mt-1 w-full rounded-lg border border-line px-3 py-2" value={rx.refills ?? 0} onChange={(e) => setRx({ ...rx, refills: Number(e.target.value) })} />
              </label>
            </div>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={Boolean(rx.daw)} onChange={(e) => setRx({ ...rx, daw: e.target.checked })} />
              Dispense as written
            </label>
            <p className="text-sm text-ink-soft">Prescriber · {identity.prescriberName}</p>
            <label className="block text-sm">
              Prescription notes
              <textarea className="mt-1 w-full rounded-lg border border-line px-3 py-2" rows={2} value={rx.notes || ""} onChange={(e) => setRx({ ...rx, notes: e.target.value })} />
            </label>
          </article>
        </section>
      ) : null}

      {step === "review" ? (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Review before sending to Operations</h2>
          {patient && product && dose ? (
            <article className="rounded-xl border border-line bg-paper p-5 text-sm">
              <p>
                <strong>{patientDisplayName(patient)}</strong> · DOB {formatDob(patient.dob)}
              </p>
              <p className="mt-2">
                {selectedFormula?.formulation || product.shortName} · {dose.label}
                {selectedFormula ? ` · ${selectedFormula.dosageForm} · ${selectedFormula.route}` : ""}
              </p>
              <p className="text-ink-soft">{rx.directions}</p>
              <p className="text-ink-soft">
                Qty {rx.quantity} {rx.quantityUnit} · {rx.refills} refill{(rx.refills || 0) === 1 ? "" : "s"}
                {rx.daw ? " · DAW" : ""}
              </p>
            </article>
          ) : (
            <p className="text-ink-soft">Finish the earlier steps first.</p>
          )}
          {alerts.length === 0 ? (
            <p className="rounded-lg border border-ok/30 bg-white px-3 py-2 text-sm text-ok">No clinical alerts on this order.</p>
          ) : (
            <ul className="space-y-2">
              {alerts.map((alert) => (
                <li
                  key={alert.id}
                  className={`rounded-lg border px-3 py-3 ${
                    alert.severity === "block" ? "border-danger/40 bg-white" : "border-amber-300 bg-amber-50"
                  }`}
                >
                  <p className="font-semibold">
                    ⚠️ {alert.title}
                  </p>
                  <p className="mt-1 text-sm">{alert.body}</p>
                  {alert.severity === "warn" ? (
                    <label className="mt-2 inline-flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={ack.includes(alert.id)}
                        onChange={(e) =>
                          setAck((current) =>
                            e.target.checked ? [...current, alert.id] : current.filter((id) => id !== alert.id),
                          )
                        }
                      />
                      I have reviewed this warning
                    </label>
                  ) : (
                    <p className="mt-2 text-sm text-danger">Required correction — return to the earlier step to fix this.</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {step !== "patient" ? (
          <button type="button" className="rounded-lg border border-line px-4 py-2 text-sm" onClick={() => setStep(STEPS[Math.max(0, STEPS.findIndex((item) => item.id === step) - 1)]!.id)}>
            Back
          </button>
        ) : null}
        {step !== "review" ? (
          <button type="button" className="rounded-lg bg-purple-deep px-4 py-2 text-sm font-semibold text-white" onClick={goNext}>
            Continue
          </button>
        ) : (
          <button
            type="button"
            className="rounded-lg bg-purple-deep px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            onClick={submit}
            disabled={!canSubmitOrder(alerts, ack)}
          >
            Submit to Operations
          </button>
        )}
        <button type="button" className="rounded-lg px-4 py-2 text-sm underline underline-offset-4" onClick={() => { persistDraft(); router.push("/account"); }}>
          Save draft & exit
        </button>
      </div>
    </div>
  );
}

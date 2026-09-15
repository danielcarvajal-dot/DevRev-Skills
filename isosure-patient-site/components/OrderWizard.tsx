"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { canSubmitOrder, evaluateOrderAlerts } from "@/lib/order-alerts";
import { fieldsForWorkflow, orderableMeta, searchOrderables } from "@/lib/orderables";
import {
  emptyPatientDraft,
  formatDob,
  patientDisplayName,
  searchPatients,
  sexLabel,
} from "@/lib/patients";
import { useStore } from "@/lib/store";
import type { Patient, Prescription, Sex } from "@/lib/types";

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
  const [newPatient, setNewPatient] = useState(emptyPatientDraft());
  const [medQuery, setMedQuery] = useState("");
  const [familySlug, setFamilySlug] = useState<string | null>(null);
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
      if (nextProduct) setFamilySlug(orderableMeta(nextProduct).familySlug);
      setStep("prescription");
    }
  }

  const patient = patients.find((item) => item.id === patientId) || null;
  const product = products.find((item) => item.id === rx.productId) || null;
  const dose = product?.doses.find((item) => item.id === rx.doseId) || null;
  const meta = product ? orderableMeta(product) : null;

  const matches = searchPatients(patients, query);
  const families = searchOrderables(products, medQuery);
  const selectedFamily = families.find((item) => item.slug === familySlug) || null;
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
    setFamilySlug(info.familySlug);
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

  function savePatientEdits(patch: Partial<Patient>) {
    if (!patient) return;
    upsertPatient({ ...patient, ...patch, address: { ...patient.address, ...(patch.address || {}) } });
  }

  function createPatient() {
    if (!newPatient.firstName.trim() || !newPatient.lastName.trim() || !newPatient.dob) {
      setError("First name, last name, and date of birth are required.");
      return;
    }
    const created = upsertPatient({
      ...newPatient,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    });
    setPatientId(created.id);
    setAdding(false);
    setNewPatient(emptyPatientDraft());
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
  if (!user || user.role !== "doctor") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-semibold">Provider login required</h1>
        <Link href="/login" className="mt-5 inline-block rounded-lg bg-purple-deep px-5 py-2.5 text-sm font-semibold text-white">
          Prescriber / facility login
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-mid">New medication order</p>
        <h1 className="mt-2 text-3xl font-semibold">Start with the patient, then the medication</h1>
        <p className="mt-2 text-sm text-ink-soft">
          You prescribe the product. Operations maps it to the formula — lots, excipients, and process stay in the lab.
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
              </p>
              <button type="button" className="mt-3 text-sm underline underline-offset-4" onClick={() => setPatientId(null)}>
                Change patient
              </button>
              <div className="mt-4 space-y-2">
                <p className="text-sm font-semibold">Additional information</p>
                <details className="rounded-lg border border-line px-3 py-2">
                  <summary className="cursor-pointer text-sm">Allergies</summary>
                  <textarea
                    className="mt-2 w-full rounded-lg border border-line px-3 py-2 text-sm"
                    rows={2}
                    value={patient.allergies}
                    onChange={(e) => savePatientEdits({ allergies: e.target.value })}
                    placeholder="e.g. penicillin, progesterone"
                  />
                </details>
                <details className="rounded-lg border border-line px-3 py-2">
                  <summary className="cursor-pointer text-sm">Contact information</summary>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <input className="rounded-lg border border-line px-3 py-2 text-sm" placeholder="Phone" value={patient.phone} onChange={(e) => savePatientEdits({ phone: e.target.value })} />
                    <input className="rounded-lg border border-line px-3 py-2 text-sm" placeholder="Email" value={patient.email} onChange={(e) => savePatientEdits({ email: e.target.value })} />
                  </div>
                </details>
                <details className="rounded-lg border border-line px-3 py-2">
                  <summary className="cursor-pointer text-sm">Shipping address</summary>
                  <div className="mt-2 grid gap-2">
                    <input className="rounded-lg border border-line px-3 py-2 text-sm" placeholder="Address" value={patient.address.line1} onChange={(e) => savePatientEdits({ address: { ...patient.address, line1: e.target.value } })} />
                    <div className="grid gap-2 sm:grid-cols-3">
                      <input className="rounded-lg border border-line px-3 py-2 text-sm" placeholder="City" value={patient.address.city} onChange={(e) => savePatientEdits({ address: { ...patient.address, city: e.target.value } })} />
                      <input className="rounded-lg border border-line px-3 py-2 text-sm" placeholder="State" value={patient.address.state} onChange={(e) => savePatientEdits({ address: { ...patient.address, state: e.target.value } })} />
                      <input className="rounded-lg border border-line px-3 py-2 text-sm" placeholder="ZIP" value={patient.address.zip} onChange={(e) => savePatientEdits({ address: { ...patient.address, zip: e.target.value } })} />
                    </div>
                  </div>
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
                <div className="space-y-3 rounded-xl border border-line bg-paper p-4">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input className="rounded-lg border border-line px-3 py-2" placeholder="First name" value={newPatient.firstName} onChange={(e) => setNewPatient({ ...newPatient, firstName: e.target.value })} />
                    <input className="rounded-lg border border-line px-3 py-2" placeholder="Last name" value={newPatient.lastName} onChange={(e) => setNewPatient({ ...newPatient, lastName: e.target.value })} />
                    <input className="rounded-lg border border-line px-3 py-2" type="date" value={newPatient.dob} onChange={(e) => setNewPatient({ ...newPatient, dob: e.target.value })} />
                    <select className="rounded-lg border border-line px-3 py-2" value={newPatient.sex} onChange={(e) => setNewPatient({ ...newPatient, sex: e.target.value as Sex })}>
                      <option value="unspecified">Sex (optional)</option>
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <p className="text-sm text-ink-soft">Phone, email, address, allergies, and clinical details can wait until after the patient is selected.</p>
                  <button type="button" className="rounded-lg bg-purple-deep px-4 py-2 text-sm font-semibold text-white" onClick={createPatient}>
                    Save patient
                  </button>
                </div>
              ) : null}
            </>
          )}
        </section>
      ) : null}

      {step === "medication" ? (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">What would you like to order?</h2>
          <label className="block text-sm">
            Search medication
            <input
              className="mt-1 w-full rounded-lg border border-line px-3 py-2"
              placeholder="Search by medication, ingredient, dosage form…"
              value={medQuery}
              onChange={(e) => setMedQuery(e.target.value)}
            />
          </label>
          <div className="grid gap-3 md:grid-cols-2">
            {families.map((family) => (
              <button
                key={family.slug}
                type="button"
                className={`rounded-xl border p-4 text-left ${familySlug === family.slug ? "border-purple-mid bg-purple-soft/50" : "border-line bg-paper"}`}
                onClick={() => {
                  setFamilySlug(family.slug);
                  if (family.products.length === 1) applyProduct(family.products[0]!.id);
                }}
              >
                <p className="font-semibold">{family.name}</p>
                <p className="mt-1 text-sm text-ink-soft">{family.forms.join(" · ")}</p>
              </button>
            ))}
          </div>
          {selectedFamily ? (
            <div className="rounded-xl border border-line bg-paper p-4">
              <p className="font-semibold">{selectedFamily.name}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedFamily.products.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`rounded-lg border px-3 py-1.5 text-sm ${item.id === product?.id ? "border-purple-mid bg-purple-soft font-semibold" : "border-line"}`}
                    onClick={() => applyProduct(item.id)}
                  >
                    {item.form}
                  </button>
                ))}
              </div>
              {product ? (
                <div className="mt-4">
                  <p className="text-sm font-semibold">Strength</p>
                  <div className="mt-2 flex flex-wrap gap-3">
                    {product.doses.map((item) => (
                      <label key={item.id} className="inline-flex items-center gap-2 text-sm">
                        <input type="radio" name="strength" checked={rx.doseId === item.id} onChange={() => applyProduct(product.id, item.id)} />
                        {item.label}
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}

      {step === "prescription" && product && dose && meta ? (
        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-xl border border-line bg-paper p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-purple-mid">Product</p>
            <h2 className="mt-1 text-xl font-semibold">What the pharmacy is making</h2>
            <p className="mt-3 text-lg font-semibold">{meta.family}</p>
            <p className="text-sm text-ink-soft">
              {product.form} · {dose.strength}
            </p>
            <p className="mt-3 text-sm text-ink-soft">
              Operations will map this prescribable product to the current formula version. Formula numbers, API lots, excipients, and process instructions are not shown here.
            </p>
          </article>
          <article className="space-y-3 rounded-xl border border-line bg-paper p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-purple-mid">Prescription</p>
            <h2 className="mt-1 text-xl font-semibold">What you are ordering for this patient</h2>
            <p className="text-sm">
              {product.shortName} · {dose.label}
            </p>
            {rxFields.includes("doseAmount") ? (
              <div className="rounded-lg border border-line bg-bg p-3">
                <p className="text-sm font-semibold">Compounding details (provider view)</p>
                <p className="mb-2 text-xs text-ink-soft">Dose and volume only. The lab chooses the formula.</p>
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
            <p className="text-sm text-ink-soft">Prescriber · {user.prescriberName}</p>
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
                {product.shortName} · {dose.label}
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
          <button type="button" className="rounded-lg bg-purple-deep px-4 py-2 text-sm font-semibold text-white" onClick={submit}>
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

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Address } from "@/lib/types";

const emptyAddress: Address = { line1: "", line2: "", city: "", state: "", zip: "" };

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, cartTotal, products, user, scripts, addScript, removeScript, placeOrder, ready } =
    useStore();
  const [address, setAddress] = useState<Address>(emptyAddress);
  const [patientName, setPatientName] = useState("");
  const [patientDob, setPatientDob] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const shipping = cartTotal >= 75 || cartTotal === 0 ? 0 : 8;

  if (!ready) {
    return <div className="mx-auto max-w-5xl px-4 py-16 text-ink-soft">Loading checkout…</div>;
  }

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-semibold">Nothing to send</h1>
        <Link href="/catalog" className="mt-4 inline-block text-purple underline underline-offset-4">
          Return to formulary
        </Link>
      </div>
    );
  }

  if (!user || user.role !== "doctor") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-semibold">Sign in as a practice first</h1>
        <Link href="/login" className="mt-4 inline-block rounded-lg bg-purple-deep px-4 py-2 text-sm font-semibold text-white">
          Sign in
        </Link>
      </div>
    );
  }

  function onFiles(files: FileList | null) {
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        addScript({
          id: crypto.randomUUID(),
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl: String(reader.result || ""),
        });
      };
      reader.readAsDataURL(file);
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!scripts.length) {
      setError("Attach at least one script before submitting.");
      return;
    }
    if (!address.line1 || !address.city || !address.state || !address.zip) {
      setError("A delivery address is required.");
      return;
    }
    const order = placeOrder({ address, notes, patientName, patientDob });
    router.push(`/order/${order.id}`);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-mid">Send to compounding</p>
      <h1 className="mt-2 text-3xl font-semibold">Upload scripts, then complete the order</h1>
      <p className="mt-2 max-w-2xl text-ink-soft">
        A prescription image or PDF is required before the lab will accept the order. Files stay in this browser until Phase 2.
      </p>

      <form onSubmit={submit} className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <section className="rounded-xl border border-line bg-paper p-5">
            <p className="font-semibold">Prescriber</p>
            <p className="mt-1 text-sm">
              {user.prescriberName} · {user.practiceName}
              <span className="block text-ink-soft">
                NPI {user.npi || "—"} · DEA {user.dea || "—"}
              </span>
            </p>
            <label className="mt-4 block text-sm">
              Patient name
              <input
                required
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-line px-3 py-2"
              />
            </label>
            <label className="mt-3 block text-sm">
              Patient date of birth
              <input
                required
                type="date"
                value={patientDob}
                onChange={(e) => setPatientDob(e.target.value)}
                className="mt-1 w-full rounded-lg border border-line px-3 py-2"
              />
            </label>
          </section>

          <section className="space-y-3 rounded-xl border border-line bg-paper p-5">
            <p className="font-semibold">Ship / deliver to</p>
            <input
              required
              placeholder="Street address"
              value={address.line1}
              onChange={(e) => setAddress({ ...address, line1: e.target.value })}
              className="w-full rounded-lg border border-line px-3 py-2"
            />
            <div className="grid gap-3 sm:grid-cols-3">
              <input
                required
                placeholder="City"
                value={address.city}
                onChange={(e) => setAddress({ ...address, city: e.target.value })}
                className="rounded-lg border border-line px-3 py-2"
              />
              <input
                required
                placeholder="State"
                value={address.state}
                onChange={(e) => setAddress({ ...address, state: e.target.value })}
                className="rounded-lg border border-line px-3 py-2"
              />
              <input
                required
                placeholder="ZIP"
                value={address.zip}
                onChange={(e) => setAddress({ ...address, zip: e.target.value })}
                className="rounded-lg border border-line px-3 py-2"
              />
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Compounding notes: flavor, allergy, match last fill"
              className="w-full rounded-lg border border-line px-3 py-2"
            />
          </section>

          <section className="rounded-xl border border-dashed border-purple-mid bg-paper p-5">
            <p className="font-semibold">Scripts</p>
            <p className="text-sm text-ink-soft">Upload one or more prescriptions (PDF, JPG, or PNG).</p>
            <input
              type="file"
              accept=".pdf,image/*"
              multiple
              className="mt-3"
              onChange={(e) => onFiles(e.target.files)}
            />
            <ul className="mt-3 space-y-2 text-sm">
              {scripts.length === 0 ? <li className="text-ink-soft">No scripts attached yet.</li> : null}
              {scripts.map((script) => (
                <li key={script.id} className="flex justify-between gap-3">
                  <span>
                    {script.name}{" "}
                    <span className="text-ink-soft">({Math.round(script.size / 1024)} KB)</span>
                  </span>
                  <button type="button" className="text-danger underline" onClick={() => removeScript(script.id)}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </section>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <button type="submit" className="rounded-lg bg-purple-deep px-5 py-3 text-sm font-semibold text-white">
            Submit order to ISOSure lab
          </button>
        </div>

        <aside className="h-fit rounded-xl border border-line bg-paper p-5">
          <h2 className="text-xl font-semibold">Order summary</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {cart.map((item) => {
              const product = products.find((p) => p.id === item.productId);
              const dose = product?.doses.find((d) => d.id === item.doseId);
              if (!product || !dose) return null;
              return (
                <li key={`${item.productId}-${item.doseId}`} className="flex justify-between gap-3">
                  <span>
                    {product.shortName}
                    <span className="block text-ink-soft">
                      {dose.label} × {item.quantity}
                    </span>
                  </span>
                  <span>{formatMoney(dose.price * item.quantity)}</span>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 flex justify-between border-t border-line pt-4">
            <span>Total</span>
            <span>{formatMoney(cartTotal + shipping)}</span>
          </div>
        </aside>
      </form>
    </div>
  );
}

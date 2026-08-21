"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/format";
import { getDose, getProduct } from "@/lib/products";
import { useStore } from "@/lib/store";
import type { Address } from "@/lib/types";

const emptyAddress: Address = {
  line1: "",
  line2: "",
  city: "",
  state: "",
  zip: "",
};

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, cartTotal, patient, placeOrder, signIn, ready } = useStore();
  const [address, setAddress] = useState<Address>(emptyAddress);
  const [notes, setNotes] = useState("");
  const [guest, setGuest] = useState({
    firstName: patient?.firstName ?? "",
    lastName: patient?.lastName ?? "",
    email: patient?.email ?? "",
    phone: patient?.phone ?? "",
    dateOfBirth: patient?.dateOfBirth ?? "",
  });
  const [error, setError] = useState("");
  const shipping = cartTotal >= 75 || cartTotal === 0 ? 0 : 8;

  if (!ready) {
    return <div className="mx-auto max-w-5xl px-4 py-16 text-ink-soft">Loading checkout…</div>;
  }

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="serif text-4xl">Nothing to check out</h1>
        <Link href="/catalog" className="mt-4 inline-block text-leaf underline underline-offset-4">
          Return to catalog
        </Link>
      </div>
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!guest.firstName || !guest.lastName || !guest.email) {
      setError("Add your name and email so we can attach this order to a profile.");
      return;
    }
    if (!address.line1 || !address.city || !address.state || !address.zip) {
      setError("A shipping address is required.");
      return;
    }
    if (!patient) {
      signIn(guest);
    }
    const order = placeOrder(address, notes);
    router.push(`/order/${order.id}`);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <p className="text-xs uppercase tracking-[0.18em] text-brass">Checkout</p>
      <h1 className="serif mt-2 text-4xl">Finalize this compound order</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        Prototype checkout only — no payment is collected. Completing the order writes it onto your patient profile.
      </p>

      <form onSubmit={submit} className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <fieldset className="rounded-2xl border border-line bg-paper-strong p-5">
            <legend className="px-1 text-sm font-medium">Patient</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                required
                placeholder="First name"
                value={guest.firstName}
                onChange={(e) => setGuest({ ...guest, firstName: e.target.value })}
                className="rounded-xl border border-line bg-paper px-3 py-2"
              />
              <input
                required
                placeholder="Last name"
                value={guest.lastName}
                onChange={(e) => setGuest({ ...guest, lastName: e.target.value })}
                className="rounded-xl border border-line bg-paper px-3 py-2"
              />
              <input
                required
                type="email"
                placeholder="Email"
                value={guest.email}
                onChange={(e) => setGuest({ ...guest, email: e.target.value })}
                className="rounded-xl border border-line bg-paper px-3 py-2 sm:col-span-2"
              />
              <input
                placeholder="Phone"
                value={guest.phone}
                onChange={(e) => setGuest({ ...guest, phone: e.target.value })}
                className="rounded-xl border border-line bg-paper px-3 py-2"
              />
              <input
                type="date"
                value={guest.dateOfBirth}
                onChange={(e) => setGuest({ ...guest, dateOfBirth: e.target.value })}
                className="rounded-xl border border-line bg-paper px-3 py-2"
              />
            </div>
          </fieldset>

          <fieldset className="rounded-2xl border border-line bg-paper-strong p-5">
            <legend className="px-1 text-sm font-medium">Ship to</legend>
            <div className="grid gap-3">
              <input
                required
                placeholder="Street address"
                value={address.line1}
                onChange={(e) => setAddress({ ...address, line1: e.target.value })}
                className="rounded-xl border border-line bg-paper px-3 py-2"
              />
              <input
                placeholder="Apt, suite"
                value={address.line2}
                onChange={(e) => setAddress({ ...address, line2: e.target.value })}
                className="rounded-xl border border-line bg-paper px-3 py-2"
              />
              <div className="grid gap-3 sm:grid-cols-3">
                <input
                  required
                  placeholder="City"
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  className="rounded-xl border border-line bg-paper px-3 py-2"
                />
                <input
                  required
                  placeholder="State"
                  value={address.state}
                  onChange={(e) => setAddress({ ...address, state: e.target.value })}
                  className="rounded-xl border border-line bg-paper px-3 py-2"
                />
                <input
                  required
                  placeholder="ZIP"
                  value={address.zip}
                  onChange={(e) => setAddress({ ...address, zip: e.target.value })}
                  className="rounded-xl border border-line bg-paper px-3 py-2"
                />
              </div>
            </div>
          </fieldset>

          <label className="block rounded-2xl border border-line bg-paper-strong p-5 text-sm">
            Notes for the pharmacist
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-2 w-full rounded-xl border border-line bg-paper px-3 py-2"
              placeholder="Flavor, allergy, or “match last fill”"
            />
          </label>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <button type="submit" className="rounded-full bg-forest px-6 py-3 text-sm text-paper-strong">
            Place prototype order
          </button>
        </div>

        <aside className="h-fit rounded-2xl border border-line bg-paper-strong p-5">
          <h2 className="serif text-2xl">Order summary</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {cart.map((item) => {
              const product = getProduct(item.productId);
              const dose = product ? getDose(product, item.doseId) : undefined;
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

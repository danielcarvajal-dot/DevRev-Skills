"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, loadDemo, patient } = useStore();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    signIn(form);
    router.push("/account");
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <p className="text-xs uppercase tracking-[0.18em] text-brass">Patient profile</p>
      <h1 className="serif mt-2 text-4xl">Create or reopen your account</h1>
      <p className="mt-3 text-ink-soft">
        Profiles live in this browser so the prototype can remember purchases and suggest the next compound. No password, no server.
      </p>

      {patient ? (
        <p className="mt-4 rounded-2xl border border-line bg-paper-strong p-4 text-sm">
          You are signed in as {patient.firstName} {patient.lastName}. Continue to your{" "}
          <a href="/account" className="underline underline-offset-4">
            profile
          </a>
          .
        </p>
      ) : null}

      <form onSubmit={submit} className="mt-8 grid gap-3 rounded-3xl border border-line bg-paper-strong p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            required
            placeholder="First name"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            className="rounded-xl border border-line bg-paper px-3 py-2"
          />
          <input
            required
            placeholder="Last name"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            className="rounded-xl border border-line bg-paper px-3 py-2"
          />
        </div>
        <input
          required
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="rounded-xl border border-line bg-paper px-3 py-2"
        />
        <input
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="rounded-xl border border-line bg-paper px-3 py-2"
        />
        <label className="text-sm text-ink-soft">
          Date of birth
          <input
            type="date"
            value={form.dateOfBirth}
            onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
            className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2 text-ink"
          />
        </label>
        <button type="submit" className="mt-2 rounded-full bg-forest py-3 text-sm text-paper-strong">
          Save profile
        </button>
      </form>

      <button
        type="button"
        onClick={() => {
          loadDemo();
          router.push("/account");
        }}
        className="mt-4 w-full rounded-full border border-forest py-3 text-sm"
      >
        Explore as demo patient (Avery Nguyen)
      </button>
    </div>
  );
}

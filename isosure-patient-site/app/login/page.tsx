"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";

export default function LoginPage() {
  const router = useRouter();
  const { signInDoctor, signInPharmacy, loadDemoDoctor, loadDemoPharmacy } = useStore();
  const [doctor, setDoctor] = useState({
    practiceName: "",
    prescriberName: "",
    npi: "",
    dea: "",
    email: "",
    phone: "",
  });
  const [pharmacy, setPharmacy] = useState({
    pharmacyName: "ISOSure Compounding Lab",
    contactName: "",
    email: "",
    phone: "",
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-mid">Access</p>
      <h1 className="mt-2 text-3xl font-semibold">Sign in as the practice or the pharmacy</h1>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <form
          className="space-y-3 rounded-xl border border-line bg-paper p-5"
          onSubmit={(e) => {
            e.preventDefault();
            signInDoctor(doctor);
            router.push("/catalog");
          }}
        >
          <p className="font-semibold">Doctor / office</p>
          <input required placeholder="Practice name" className="w-full rounded-lg border border-line px-3 py-2" value={doctor.practiceName} onChange={(e) => setDoctor({ ...doctor, practiceName: e.target.value })} />
          <input required placeholder="Prescriber name" className="w-full rounded-lg border border-line px-3 py-2" value={doctor.prescriberName} onChange={(e) => setDoctor({ ...doctor, prescriberName: e.target.value })} />
          <input placeholder="NPI" className="w-full rounded-lg border border-line px-3 py-2" value={doctor.npi} onChange={(e) => setDoctor({ ...doctor, npi: e.target.value })} />
          <input placeholder="DEA" className="w-full rounded-lg border border-line px-3 py-2" value={doctor.dea} onChange={(e) => setDoctor({ ...doctor, dea: e.target.value })} />
          <input required type="email" placeholder="Office email" className="w-full rounded-lg border border-line px-3 py-2" value={doctor.email} onChange={(e) => setDoctor({ ...doctor, email: e.target.value })} />
          <input placeholder="Phone" className="w-full rounded-lg border border-line px-3 py-2" value={doctor.phone} onChange={(e) => setDoctor({ ...doctor, phone: e.target.value })} />
          <button type="submit" className="w-full rounded-lg bg-purple-deep py-2.5 text-sm font-semibold text-white">
            Save practice profile
          </button>
          <button
            type="button"
            className="w-full rounded-lg border border-line py-2.5 text-sm"
            onClick={() => {
              loadDemoDoctor();
              router.push("/account");
            }}
          >
            Use demo practice (Hawthorne Family Medicine)
          </button>
        </form>

        <form
          className="space-y-3 rounded-xl border border-line bg-paper p-5"
          onSubmit={(e) => {
            e.preventDefault();
            signInPharmacy(pharmacy);
            router.push("/admin/orders");
          }}
        >
          <p className="font-semibold">Compounding pharmacy admin</p>
          <input required placeholder="Pharmacy name" className="w-full rounded-lg border border-line px-3 py-2" value={pharmacy.pharmacyName} onChange={(e) => setPharmacy({ ...pharmacy, pharmacyName: e.target.value })} />
          <input required placeholder="Pharmacist / admin name" className="w-full rounded-lg border border-line px-3 py-2" value={pharmacy.contactName} onChange={(e) => setPharmacy({ ...pharmacy, contactName: e.target.value })} />
          <input required type="email" placeholder="Lab email" className="w-full rounded-lg border border-line px-3 py-2" value={pharmacy.email} onChange={(e) => setPharmacy({ ...pharmacy, email: e.target.value })} />
          <input placeholder="Phone" className="w-full rounded-lg border border-line px-3 py-2" value={pharmacy.phone} onChange={(e) => setPharmacy({ ...pharmacy, phone: e.target.value })} />
          <button type="submit" className="w-full rounded-lg bg-purple-mid py-2.5 text-sm font-semibold text-white">
            Save pharmacy admin
          </button>
          <button
            type="button"
            className="w-full rounded-lg border border-line py-2.5 text-sm"
            onClick={() => {
              loadDemoPharmacy();
              router.push("/admin/orders");
            }}
          >
            Use demo pharmacist (Jordan Hale, RPh)
          </button>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { parseFormularyCsv, parseFormularyJson, SAMPLE_CSV } from "@/lib/catalog-io";
import { formatMoney } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function FormularyAdminPage() {
  const { user, products, ready, upsertProduct, removeProduct, replaceFormulary } = useStore();
  const [form, setForm] = useState({
    name: "",
    shortName: "",
    category: "Hormone Therapy",
    form: "Capsule",
    doses: "50 mg:42|100 mg:52",
    summary: "",
  });
  const [error, setError] = useState("");

  if (!ready) return <div className="mx-auto max-w-6xl px-4 py-16 text-ink-soft">Loading…</div>;
  if (user?.role !== "pharmacy") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-semibold">Pharmacy admin only</h1>
        <Link href="/login" className="mt-4 inline-block rounded-lg bg-purple-deep px-4 py-2 text-sm font-semibold text-white">
          Sign in as pharmacy
        </Link>
      </div>
    );
  }

  function parseDoses(raw: string) {
    return raw.split("|").map((part, index) => {
      const [label, price] = part.split(":").map((s) => s.trim());
      return {
        id: `dose-${index}-${(label || "std").toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        label: label || `Dose ${index + 1}`,
        strength: label || `Dose ${index + 1}`,
        price: Number(price) || 0,
      };
    });
  }

  function onUpload(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result || "");
        const next = file.name.endsWith(".json") ? parseFormularyJson(text) : parseFormularyCsv(text);
        replaceFormulary(next);
        setError("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not import that file.");
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-mid">Pharmacy admin</p>
        <h1 className="mt-2 text-3xl font-semibold">Medication list</h1>
        <p className="mt-2 max-w-3xl text-ink-soft">
          Upload a CSV or JSON list, or add and edit compounds by hand. Doctors order from this list.
          CSV columns: <code>name,shortName,category,form,doses,summary</code>. Doses use{" "}
          <code>label:price|label:price</code>.
        </p>
      </div>

      <section className="rounded-xl border border-line bg-paper p-5">
        <p className="font-semibold">Upload a custom list</p>
        <input
          type="file"
          accept=".csv,.json,text/csv,application/json"
          className="mt-3"
          onChange={(e) => onUpload(e.target.files?.[0])}
        />
        <p className="mt-2 text-sm text-ink-soft">Upload replaces the current formulary.</p>
        <button
          type="button"
          className="mt-2 text-sm text-purple underline"
          onClick={() => {
            const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "isosure-formulary-sample.csv";
            a.click();
          }}
        >
          Download sample CSV
        </button>
      </section>

      <form
        className="space-y-3 rounded-xl border border-line bg-paper p-5"
        onSubmit={(e) => {
          e.preventDefault();
          upsertProduct({
            id: form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            slug: form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            name: form.name,
            shortName: form.shortName || form.name,
            category: form.category,
            form: form.form,
            summary: form.summary,
            description: form.summary,
            howToUse: "",
            tags: [],
            requiresRx: true,
            doses: parseDoses(form.doses),
          });
          setForm({ ...form, name: "", shortName: "", summary: "" });
        }}
      >
        <p className="font-semibold">Manually add a compound</p>
        <div className="grid gap-3 md:grid-cols-2">
          <input required placeholder="Medication name" className="rounded-lg border border-line px-3 py-2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input placeholder="Short name" className="rounded-lg border border-line px-3 py-2" value={form.shortName} onChange={(e) => setForm({ ...form, shortName: e.target.value })} />
          <input placeholder="Category" className="rounded-lg border border-line px-3 py-2" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <input required placeholder="Form" className="rounded-lg border border-line px-3 py-2" value={form.form} onChange={(e) => setForm({ ...form, form: e.target.value })} />
        </div>
        <input required placeholder="Doses, e.g. 50 mg:42|100 mg:52" className="w-full rounded-lg border border-line px-3 py-2" value={form.doses} onChange={(e) => setForm({ ...form, doses: e.target.value })} />
        <input placeholder="Short description" className="w-full rounded-lg border border-line px-3 py-2" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
        <button type="submit" className="rounded-lg bg-purple-deep px-4 py-2 text-sm font-semibold text-white">
          Add to formulary
        </button>
      </form>
      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <div className="overflow-x-auto rounded-xl border border-line bg-paper">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-[#fbf9fe] text-[11px] uppercase tracking-[0.08em] text-ink-soft">
            <tr>
              <th className="px-3 py-3">Medication</th>
              <th className="px-3 py-3">Doses</th>
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-t border-line">
                <td className="px-3 py-3">
                  <p className="font-semibold">{product.name}</p>
                  <p className="text-ink-soft">
                    {product.form} · {product.category}
                  </p>
                </td>
                <td className="px-3 py-3">
                  {product.doses.map((d) => `${d.label} ${formatMoney(d.price)}`).join(" · ")}
                </td>
                <td className="px-3 py-3">
                  <button
                    type="button"
                    className="mr-3 text-purple underline"
                    onClick={() => {
                      const name = window.prompt("Medication name", product.name);
                      if (name == null) return;
                      const doses = window.prompt(
                        "Doses as label:price|label:price",
                        product.doses.map((d) => `${d.label}:${d.price}`).join("|"),
                      );
                      if (doses == null) return;
                      upsertProduct({
                        ...product,
                        name,
                        doses: parseDoses(doses),
                      });
                    }}
                  >
                    Edit
                  </button>
                  <button type="button" className="text-danger underline" onClick={() => removeProduct(product.id)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

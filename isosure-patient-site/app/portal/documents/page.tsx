"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/format";
import { DOCUMENT_KIND_LABEL } from "@/lib/operations";
import { useStore } from "@/lib/store";
import type { DocumentKind } from "@/lib/types";

export default function DocumentsPage() {
  const { user, documents, orders, ready, addDocument } = useStore();
  const [kind, setKind] = useState<DocumentKind>("rx");
  const [orderId, setOrderId] = useState("");

  if (!ready) return <div className="mx-auto max-w-4xl px-4 py-16 text-ink-soft">Loading…</div>;
  if (!user || user.role !== "doctor") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-semibold">Provider login required</h1>
        <Link href="/login" className="mt-4 inline-block text-purple underline">Sign in</Link>
      </div>
    );
  }

  function onFiles(files: FileList | null) {
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        addDocument({
          id: crypto.randomUUID(),
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl: String(reader.result || ""),
          kind,
          orderId: orderId || undefined,
          uploadedAt: new Date().toISOString(),
          uploadedBy: "provider",
        });
      };
      reader.readAsDataURL(file);
    });
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-mid">Provider portal</p>
      <h1 className="mt-2 text-3xl font-semibold">Document exchange</h1>
      <p className="mt-2 text-ink-soft">
        Send Rx images, PA forms, and patient-specific formulas to Operations. Files are stored as
        documents only — this portal does not interpret or compound them.
      </p>

      <section className="mt-6 space-y-3 rounded-xl border border-dashed border-purple-mid bg-paper p-5">
        <label className="block text-sm">
          Document type
          <select
            className="mt-1 w-full rounded-lg border border-line px-3 py-2"
            value={kind}
            onChange={(e) => setKind(e.target.value as DocumentKind)}
          >
            <option value="rx">Rx image</option>
            <option value="pa">PA form</option>
            <option value="formula">Patient-specific formula</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="block text-sm">
          Related order (optional)
          <select
            className="mt-1 w-full rounded-lg border border-line px-3 py-2"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
          >
            <option value="">None</option>
            {orders.map((order) => (
              <option key={order.id} value={order.id}>
                {order.patientName} · {order.id.slice(-6).toUpperCase()}
              </option>
            ))}
          </select>
        </label>
        <input type="file" accept=".pdf,image/*" multiple onChange={(e) => onFiles(e.target.files)} />
      </section>

      <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-paper">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-[#fbf9fe] text-[11px] uppercase tracking-[0.08em] text-ink-soft">
            <tr>
              <th className="px-3 py-3">Document</th>
              <th className="px-3 py-3">Type</th>
              <th className="px-3 py-3">Order</th>
              <th className="px-3 py-3">Uploaded</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id} className="border-t border-line">
                <td className="px-3 py-3">
                  {doc.dataUrl ? (
                    <a href={doc.dataUrl} download={doc.name} className="text-purple underline">
                      {doc.name}
                    </a>
                  ) : (
                    doc.name
                  )}
                </td>
                <td className="px-3 py-3">{DOCUMENT_KIND_LABEL[doc.kind]}</td>
                <td className="px-3 py-3">{doc.orderId ? doc.orderId.slice(-6).toUpperCase() : "—"}</td>
                <td className="px-3 py-3">{formatDate(doc.uploadedAt)}</td>
              </tr>
            ))}
            {documents.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-ink-soft">
                  No documents exchanged yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

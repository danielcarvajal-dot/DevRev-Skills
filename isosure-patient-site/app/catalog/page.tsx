import { Suspense } from "react";
import { CatalogClient } from "./CatalogClient";

export default function CatalogPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl px-4 py-16 text-ink-soft">Loading catalog…</div>}>
      <CatalogClient />
    </Suspense>
  );
}

"use client";

import { Suspense } from "react";
import { OrderWizard } from "@/components/OrderWizard";

export default function NewOrderPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-5xl px-4 py-16 text-ink-soft">Loading order…</div>}>
      <OrderWizard />
    </Suspense>
  );
}

/**
 * Phase 2 — move this prototype onto a production website.
 *
 * Nothing here is live yet. These contracts are the seam we will swap
 * when orders start leaving the browser and entering a real pharmacy system.
 *
 * Planned production endpoints (do not call from this prototype):
 *   POST /api/v1/auth/session
 *   GET  /api/v1/formulary
 *   PUT  /api/v1/formulary
 *   POST /api/v1/formulary/import
 *   POST /api/v1/orders
 *   GET  /api/v1/orders
 *   PATCH /api/v1/orders/:id/status
 *   POST /api/v1/orders/:id/scripts
 *
 * Current prototype storage is localStorage key `isosure.practice.v2`.
 * When Phase 2 lands, replace `lib/store.tsx` persistence only — keep
 * the Doctor, Pharmacy, Product, Order, and ScriptFile shapes.
 */
export const PHASE2 = {
  status: "prepared",
  storageKey: "isosure.practice.v2",
  productionReady: false,
} as const;

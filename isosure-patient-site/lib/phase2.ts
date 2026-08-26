/**
 * Phase 2 — move this prototype onto a production website.
 *
 * Provider Portal is a thin client to Operations. Do not add compounding
 * formulas, BUD math, or mixing steps to the provider UI.
 *
 * Planned production endpoints (not called yet):
 *   POST /api/v1/auth/session
 *   GET  /api/v1/formulary            (published orderables only)
 *   POST /api/v1/orders
 *   GET  /api/v1/orders
 *   POST /api/v1/orders/:id/refills
 *   POST /api/v1/documents
 *   GET  /api/v1/notifications
 *   PATCH /api/v1/orders/:id/status   (Operations only)
 *
 * Current prototype storage: localStorage key `isosure.practice.v3`.
 */
export const PHASE2 = {
  status: "prepared",
  storageKey: "isosure.practice.v3",
  productionReady: false,
  providerIsThinClient: true,
} as const;

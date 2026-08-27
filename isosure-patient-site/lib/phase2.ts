/**
 * Phase 2 — move this prototype onto a production website.
 *
 * Two surfaces share one store:
 *   1. Provider Portal (thin client) — no BUD, MFR, or compounding UI
 *   2. Operations System (LIMS/MOM) — intake → MFR → batch → label → ship
 *
 * Planned production endpoints (not called yet):
 *   POST /api/v1/auth/session
 *   GET  /api/v1/formulary
 *   POST /api/v1/orders
 *   GET  /api/v1/orders
 *   POST /api/v1/orders/:id/refills
 *   POST /api/v1/documents
 *   GET  /api/v1/notifications
 *   PATCH /api/v1/orders/:id/status          (Operations)
 *   GET  /api/v1/ops/mfr
 *   POST /api/v1/ops/batches
 *   POST /api/v1/ops/batches/:id/advance
 *   GET  /api/v1/ops/inventory
 *   POST /api/v1/ops/environment
 *
 * Current prototype storage: localStorage key `isosure.practice.v4`.
 */
export const PHASE2 = {
  status: "prepared",
  storageKey: "isosure.practice.v4",
  productionReady: false,
  providerIsThinClient: true,
  operationsIsLims: true,
} as const;

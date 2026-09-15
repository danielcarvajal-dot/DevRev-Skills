# ISOSure (prototype)

Two surfaces share one local store:

1. **Provider portal** (thin client) — prescriber/facility login, orders, status, refills, documents, notifications. No BUD or compounding math.
2. **Operations** (LIMS/MOM) — order intake → MFR → compounding record → labeling → dispense/ship, plus BUD, HD/NIOSH flags, lots/COAs, and environment logs.

## Preview without Next.js

Open `../isosure-preview.html` in a browser (keep the `../brand` logo files next to it).

- Demo prescriber: **Demo prescriber (Hawthorne Family Medicine)**
- Demo lab: **Demo operations (Jordan Hale, RPh)** then open **Lab**

## Run locally

```bash
npm install
npm run dev
```

Operations routes live under `/ops`. Provider routes are unchanged (`/catalog`, `/account`, `/portal/*`).

Phase 2 will replace `localStorage` (`lib/phase2.ts`) with the production API.

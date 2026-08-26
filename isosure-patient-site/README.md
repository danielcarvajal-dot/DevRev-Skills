# ISOSure practice portal (prototype)

Doctors and offices place compounding orders. Pharmacy admins manage the medication list and the production queue.

## Preview without Next.js

Open `../isosure-preview.html` in a browser (keep the `../brand` logo files next to it).

## Run locally

```bash
npm install
npm run dev
```

## Roles

- **Doctor / office:** list-style formulary, radio-button doses, script upload at checkout
- **Pharmacy admin:** upload or hand-edit the formulary; receive orders and update production status

Brand assets live in `public/brand/`. Rename tokens in `lib/brand.ts`.

Phase 2 will replace `localStorage` in `lib/store.tsx` with the production API sketched in `lib/phase2.ts`.

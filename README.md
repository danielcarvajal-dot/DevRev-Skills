# ISOSure practice ordering prototype

Doctors and offices order compounded medications. The compounding pharmacy administers the formulary and the production queue.

## Fastest preview

Keep these two files together, then open the HTML in a browser:

- [`isosure-preview.html`](isosure-preview.html)
- [`brand/isosure-logo.png`](brand/isosure-logo.png) and [`brand/isosure-logo-inverse.png`](brand/isosure-logo-inverse.png)

Double-click `isosure-preview.html`. No install is required.

On **Sign in**:
- **Use demo practice** to order as Hawthorne Family Medicine
- **Use demo pharmacist** to edit the formulary and move incoming orders through production

## Next.js app

```bash
cd isosure-patient-site
npm install
npm run dev
```

Phase 2 (not built yet) will send these same order objects to a production website. See `isosure-patient-site/lib/phase2.ts`.

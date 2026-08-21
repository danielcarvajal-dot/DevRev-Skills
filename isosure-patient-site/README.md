# ISOSURE patient website (prototype)

A patient-facing catalog for a compounding pharmacy. The pharmacy name is centralized in `lib/brand.ts` so it can be replaced later.

## What this prototype does

- Browse a fake catalog of compounded products
- Choose a product and a specific dose/strength
- Add items to a cart and complete a mock checkout
- Create a patient profile stored in the browser
- Remember past purchases and suggest related compounds

No real prescriptions are filled and no payment is processed. Profile, cart, and order history persist in `localStorage`.

## Fastest preview

Open [`../isosure-preview.html`](../isosure-preview.html) in any browser (double-click the file). No `npm` or server is required.

## Run locally

```bash
cd isosure-patient-site
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Use **Explore as demo patient** on the sign-in page to load Avery Nguyen with prior HRT and LDN orders, then review the suggested next compounds on the profile.

## Replace the business name

Edit `lib/brand.ts`. Product names currently use the `Iso…` prefix and can be renamed in `lib/products.ts`.

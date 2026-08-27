import type { Category, Form, Product } from "./types";

export const CATEGORIES: Category[] = [
  "Hormone Therapy",
  "Women's Health",
  "Men's Health",
  "Thyroid",
  "Pain & Inflammation",
  "Dermatology",
  "Wellness",
  "Pediatric",
];

export const FORMS: Form[] = [
  "Cream",
  "Gel",
  "Capsule",
  "Troche",
  "Suspension",
  "Nasal spray",
  "Topical",
];

export const PRODUCTS: Product[] = [
  {
    id: "estradiol-cream",
    slug: "isobalance-estradiol-cream",
    name: "IsoBalance Estradiol Cream",
    shortName: "Estradiol Cream",
    category: "Hormone Therapy",
    form: "Cream",
    featured: true,
    requiresRx: true,
    tags: ["hrt", "estrogen", "women", "bioidentical", "topical"],
    summary: "Bioidentical estradiol in a vanishing cream for transdermal hormone support.",
    description:
      "A pharmacist-compounded estradiol cream prepared to the strength your prescriber specifies. The base is unscented, dye-free, and designed for once-daily application to thin-skin sites.",
    howToUse: "Apply the measured dose to clean, dry skin. Rotate sites. Wash hands after use.",
    doses: [
      { id: "e2-025", label: "0.25 mg/g", strength: "0.25 mg/g", price: 48 },
      { id: "e2-05", label: "0.5 mg/g", strength: "0.5 mg/g", price: 56 },
      { id: "e2-1", label: "1 mg/g", strength: "1 mg/g", price: 64 },
    ],
  },
  {
    id: "progesterone-caps",
    slug: "isocalm-progesterone-capsules",
    name: "IsoCalm Progesterone Capsules",
    shortName: "Progesterone Capsules",
    category: "Women's Health",
    form: "Capsule",
    featured: true,
    requiresRx: true,
    tags: ["hrt", "progesterone", "women", "bioidentical", "sleep"],
    summary: "Micronized progesterone in oil-filled capsules for evening hormone balance.",
    description:
      "Oral micronized progesterone compounded in a sunflower-oil vehicle. Often paired with estradiol therapy. Available in common luteal-support strengths.",
    howToUse: "Take at bedtime unless your prescriber directs otherwise. Swallow whole with water.",
    doses: [
      { id: "p4-50", label: "50 mg", strength: "50 mg", price: 42 },
      { id: "p4-100", label: "100 mg", strength: "100 mg", price: 52 },
      { id: "p4-200", label: "200 mg", strength: "200 mg", price: 68 },
    ],
  },
  {
    id: "testosterone-gel",
    slug: "isovigor-testosterone-gel",
    name: "IsoVigor Testosterone Gel",
    shortName: "Testosterone Gel",
    category: "Men's Health",
    form: "Gel",
    featured: true,
    requiresRx: true,
    tags: ["hrt", "testosterone", "men", "bioidentical", "topical"],
    summary: "Clear, quick-dry testosterone gel compounded to a measured daily dose.",
    description:
      "A transdermal testosterone gel in an alcohol-hydrogel base. Each pump or measured syringe delivers a consistent milligram amount so your clinician can titrate precisely.",
    howToUse: "Apply to shoulders or upper arms. Allow to dry. Avoid skin-to-skin contact until dry.",
    doses: [
      { id: "t-10", label: "10 mg/mL", strength: "10 mg/mL", price: 62 },
      { id: "t-20", label: "20 mg/mL", strength: "20 mg/mL", price: 74 },
      { id: "t-50", label: "50 mg/mL", strength: "50 mg/mL", price: 88 },
    ],
  },
  {
    id: "thyroid-combo",
    slug: "isothyroid-t3-t4-capsules",
    name: "IsoThyroid T3/T4 Capsules",
    shortName: "T3/T4 Capsules",
    category: "Thyroid",
    form: "Capsule",
    featured: true,
    requiresRx: true,
    tags: ["thyroid", "t3", "t4", "energy", "metabolism"],
    summary: "Custom liothyronine and levothyroxine ratios in dye-free capsules.",
    description:
      "Immediate-release T3/T4 capsules compounded without common fillers. Ratios are prepared to the exact microgram combination on your prescription.",
    howToUse: "Take on an empty stomach, 30–60 minutes before food or coffee.",
    doses: [
      { id: "th-5-25", label: "5 / 25 mcg", strength: "T3 5 mcg / T4 25 mcg", price: 38 },
      { id: "th-10-50", label: "10 / 50 mcg", strength: "T3 10 mcg / T4 50 mcg", price: 44 },
      { id: "th-15-75", label: "15 / 75 mcg", strength: "T3 15 mcg / T4 75 mcg", price: 52 },
    ],
  },
  {
    id: "ketoprofen-cream",
    slug: "isoease-ketoprofen-cream",
    name: "IsoEase Ketoprofen Cream",
    shortName: "Ketoprofen Cream",
    category: "Pain & Inflammation",
    form: "Cream",
    featured: true,
    requiresRx: true,
    tags: ["pain", "nsaid", "topical", "joints", "inflammation"],
    summary: "High-strength topical NSAID cream for localized joint and muscle pain.",
    description:
      "Ketoprofen compounded in a penetrating cream base so more of the dose stays at the application site and less circulates systemically than an oral NSAID.",
    howToUse: "Massage a thin layer into the affected area up to three times daily.",
    doses: [
      { id: "keto-10", label: "10%", strength: "10%", price: 46 },
      { id: "keto-15", label: "15%", strength: "15%", price: 54 },
      { id: "keto-20", label: "20%", strength: "20%", price: 62 },
    ],
  },
  {
    id: "gabapentin-topical",
    slug: "isonerve-gabapentin-topical",
    name: "IsoNerve Gabapentin Topical",
    shortName: "Gabapentin Topical",
    category: "Pain & Inflammation",
    form: "Topical",
    requiresRx: true,
    tags: ["pain", "nerve", "neuropathy", "topical"],
    summary: "Targeted gabapentin gel for neuropathic burning, tingling, and allodynia.",
    description:
      "A PLO-style topical that delivers gabapentin to peripheral nerve endings. Often used when oral gabapentinoids cause sedation.",
    howToUse: "Apply to intact skin over the painful area. Do not use on open wounds.",
    doses: [
      { id: "gaba-6", label: "6%", strength: "6%", price: 58 },
      { id: "gaba-10", label: "10%", strength: "10%", price: 68 },
    ],
  },
  {
    id: "diclofenac-gel",
    slug: "isoflex-diclofenac-gel",
    name: "IsoFlex Diclofenac Gel",
    shortName: "Diclofenac Gel",
    category: "Pain & Inflammation",
    form: "Gel",
    requiresRx: true,
    tags: ["pain", "nsaid", "joints", "topical", "inflammation"],
    summary: "Clear diclofenac gel in strengths above typical retail options.",
    description:
      "Compounded diclofenac sodium gel for osteoarthritis and overuse injuries. The higher strengths are reserved for clinician-directed use.",
    howToUse: "Apply a ribbon of gel and rub until absorbed. Wash hands after applying.",
    doses: [
      { id: "diclo-3", label: "3%", strength: "3%", price: 36 },
      { id: "diclo-5", label: "5%", strength: "5%", price: 44 },
      { id: "diclo-10", label: "10%", strength: "10%", price: 55 },
    ],
  },
  {
    id: "ldn-caps",
    slug: "isoreset-low-dose-naltrexone",
    name: "IsoReset Low-Dose Naltrexone",
    shortName: "Low-Dose Naltrexone",
    category: "Wellness",
    form: "Capsule",
    featured: true,
    requiresRx: true,
    tags: ["ldn", "immune", "inflammation", "sleep", "wellness"],
    summary: "Precise microgram-to-milligram LDN capsules, dye- and filler-conscious.",
    description:
      "Naltrexone compounded at low doses commonly used for immune modulation and inflammatory conditions. Each lot is potency-checked before it leaves the lab.",
    howToUse: "Typically taken at bedtime. Your prescriber will set the titration schedule.",
    doses: [
      { id: "ldn-15", label: "1.5 mg", strength: "1.5 mg", price: 34 },
      { id: "ldn-3", label: "3 mg", strength: "3 mg", price: 36 },
      { id: "ldn-45", label: "4.5 mg", strength: "4.5 mg", price: 38 },
    ],
  },
  {
    id: "hydroquinone",
    slug: "isoglow-hydroquinone-cream",
    name: "IsoGlow Hydroquinone Cream",
    shortName: "Hydroquinone Cream",
    category: "Dermatology",
    form: "Cream",
    requiresRx: true,
    tags: ["derm", "pigment", "melasma", "skin"],
    summary: "Prescription hydroquinone for stubborn discoloration and melasma.",
    description:
      "A fading cream compounded with antioxidants in a bland, fragrance-free base. Strengths above 4% are prepared only on a valid prescription.",
    howToUse: "Apply a pea-sized amount to affected areas at night. Use daily sunscreen.",
    doses: [
      { id: "hq-4", label: "4%", strength: "4%", price: 41 },
      { id: "hq-6", label: "6%", strength: "6%", price: 49 },
      { id: "hq-8", label: "8%", strength: "8%", price: 58 },
    ],
  },
  {
    id: "tretinoin",
    slug: "isoclear-tretinoin-cream",
    name: "IsoClear Tretinoin Cream",
    shortName: "Tretinoin Cream",
    category: "Dermatology",
    form: "Cream",
    requiresRx: true,
    tags: ["derm", "retinoid", "acne", "aging", "skin"],
    summary: "Classic tretinoin in a soothing cream for patients who find gels too drying.",
    description:
      "Tretinoin compounded into a ceramide-rich cream. Useful when commercial gels cause peeling or when a specific strength is needed.",
    howToUse: "Start two to three nights a week. Apply a rice-grain amount to dry skin.",
    doses: [
      { id: "tret-025", label: "0.025%", strength: "0.025%", price: 39 },
      { id: "tret-05", label: "0.05%", strength: "0.05%", price: 45 },
      { id: "tret-1", label: "0.1%", strength: "0.1%", price: 52 },
    ],
  },
  {
    id: "minoxidil",
    slug: "isofollicle-minoxidil-compound",
    name: "IsoFollicle Minoxidil Compound",
    shortName: "Minoxidil Compound",
    category: "Dermatology",
    form: "Topical",
    requiresRx: true,
    tags: ["derm", "hair", "minoxidil", "scalp"],
    summary: "Higher-strength minoxidil with optional anti-androgen add-ins.",
    description:
      "A scalp solution compounded above typical 5% retail strengths. Your prescriber can add complementary actives; this prototype lists minoxidil-only options.",
    howToUse: "Apply 1 mL to a dry scalp once daily. Wash hands. Allow to dry before styling.",
    doses: [
      { id: "mino-5", label: "5%", strength: "5%", price: 44 },
      { id: "mino-7", label: "7%", strength: "7%", price: 54 },
      { id: "mino-10", label: "10%", strength: "10%", price: 66 },
    ],
  },
  {
    id: "omeprazole-susp",
    slug: "isosoothe-pediatric-omeprazole",
    name: "IsoSoothe Pediatric Omeprazole",
    shortName: "Pediatric Omeprazole",
    category: "Pediatric",
    form: "Suspension",
    requiresRx: true,
    tags: ["pediatric", "gi", "reflux", "liquid", "flavored"],
    summary: "Flavored omeprazole suspension when capsules are too large to swallow.",
    description:
      "A sugar-free, dye-conscious oral suspension compounded for infants and children. Flavor is marked on the bottle; this demo lists bubblegum as the default.",
    howToUse: "Shake well. Draw the prescribed milliliters with the oral syringe provided.",
    doses: [
      { id: "ome-2", label: "2 mg/mL", strength: "2 mg/mL", price: 48 },
      { id: "ome-5", label: "5 mg/mL", strength: "5 mg/mL", price: 56 },
    ],
  },
  {
    id: "melatonin-troche",
    slug: "isorest-melatonin-troches",
    name: "IsoRest Melatonin Troches",
    shortName: "Melatonin Troches",
    category: "Wellness",
    form: "Troche",
    requiresRx: false,
    tags: ["sleep", "wellness", "troche", "melatonin"],
    summary: "Slow-dissolve melatonin troches in low, titratable strengths.",
    description:
      "Sublingual melatonin for patients who want a smaller dose than retail gummies, or who prefer to avoid sugars and dyes.",
    howToUse: "Place between cheek and gum 30 minutes before bed. Do not chew.",
    doses: [
      { id: "mel-1", label: "1 mg", strength: "1 mg", price: 22 },
      { id: "mel-3", label: "3 mg", strength: "3 mg", price: 24 },
      { id: "mel-5", label: "5 mg", strength: "5 mg", price: 26 },
    ],
  },
  {
    id: "dhea-caps",
    slug: "isoprime-dhea-capsules",
    name: "IsoPrime DHEA Capsules",
    shortName: "DHEA Capsules",
    category: "Hormone Therapy",
    form: "Capsule",
    requiresRx: true,
    tags: ["hrt", "dhea", "adrenal", "women", "men"],
    summary: "Micronized DHEA in conservative strengths for adrenal support protocols.",
    description:
      "Pharmaceutical-grade DHEA compounded into vegetarian capsules. Often used alongside other bioidentical hormones under lab monitoring.",
    howToUse: "Take in the morning with food unless directed otherwise.",
    doses: [
      { id: "dhea-5", label: "5 mg", strength: "5 mg", price: 28 },
      { id: "dhea-10", label: "10 mg", strength: "10 mg", price: 32 },
      { id: "dhea-25", label: "25 mg", strength: "25 mg", price: 38 },
    ],
  },
  {
    id: "pregnenolone",
    slug: "isobloom-pregnenolone-capsules",
    name: "IsoBloom Pregnenolone Capsules",
    shortName: "Pregnenolone Capsules",
    category: "Hormone Therapy",
    form: "Capsule",
    requiresRx: true,
    tags: ["hrt", "pregnenolone", "cognition", "women", "men"],
    summary: "Pregnenolone capsules for clinician-guided precursor hormone support.",
    description:
      "A foundational steroid hormone precursor, compounded so your prescriber can start low and adjust from follow-up labs.",
    howToUse: "Usually taken in the morning. Avoid late-day doses if they affect sleep.",
    doses: [
      { id: "preg-10", label: "10 mg", strength: "10 mg", price: 29 },
      { id: "preg-25", label: "25 mg", strength: "25 mg", price: 34 },
      { id: "preg-50", label: "50 mg", strength: "50 mg", price: 40 },
    ],
  },
  {
    id: "sildenafil-troche",
    slug: "isolift-sildenafil-troches",
    name: "IsoLift Sildenafil Troches",
    shortName: "Sildenafil Troches",
    category: "Men's Health",
    form: "Troche",
    requiresRx: true,
    tags: ["men", "ed", "urology", "troche"],
    summary: "Fast-dissolve sildenafil troches when tablets are inconvenient.",
    description:
      "A buccal troche that bypasses some first-pass metabolism. Flavored lightly with mint. Not a substitute for a cardiovascular evaluation.",
    howToUse: "Dissolve in the cheek 30–60 minutes before activity. Do not combine with nitrates.",
    doses: [
      { id: "sild-25", label: "25 mg", strength: "25 mg", price: 48 },
      { id: "sild-50", label: "50 mg", strength: "50 mg", price: 62 },
      { id: "sild-100", label: "100 mg", strength: "100 mg", price: 78 },
    ],
  },
  {
    id: "glutathione",
    slug: "isoshield-glutathione-capsules",
    name: "IsoShield Glutathione Capsules",
    shortName: "Glutathione Capsules",
    category: "Wellness",
    form: "Capsule",
    requiresRx: false,
    tags: ["wellness", "antioxidant", "liver", "longevity"],
    summary: "Reduced glutathione in acid-resistant capsules.",
    description:
      "A compounded antioxidant capsule for patients whose clinicians recommend oral glutathione as part of a broader plan.",
    howToUse: "Take on an empty stomach. Store in a cool, dry place.",
    doses: [
      { id: "glu-250", label: "250 mg", strength: "250 mg", price: 36 },
      { id: "glu-500", label: "500 mg", strength: "500 mg", price: 48 },
    ],
  },
  {
    id: "nad-spray",
    slug: "isopulse-nad-nasal-spray",
    name: "IsoPulse NAD+ Nasal Spray",
    shortName: "NAD+ Nasal Spray",
    category: "Wellness",
    form: "Nasal spray",
    requiresRx: true,
    tags: ["wellness", "longevity", "energy", "nad"],
    summary: "Metered NAD+ nasal spray for patients exploring cellular-energy support.",
    description:
      "A preserved aqueous nasal spray delivering nicotinamide adenine dinucleotide. This listing is a prototype illustration, not a clinical claim.",
    howToUse: "Prime the pump. Administer the prescribed sprays into each nostril.",
    doses: [
      { id: "nad-50", label: "50 mg/mL", strength: "50 mg/mL", price: 84 },
      { id: "nad-100", label: "100 mg/mL", strength: "100 mg/mL", price: 112 },
    ],
  },
];

export function getProduct(slugOrId: string) {
  return PRODUCTS.find((p) => p.slug === slugOrId || p.id === slugOrId);
}

export function getDose(product: Product, doseId: string) {
  return product.doses.find((d) => d.id === doseId);
}

export function featuredProducts() {
  return PRODUCTS.filter((p) => p.featured);
}

export function productsByCategory(category: Category) {
  return PRODUCTS.filter((p) => p.category === category);
}

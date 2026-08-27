import type { Product } from "./types";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || crypto.randomUUID();
}

function parseDoses(raw: string) {
  return raw.split("|").map((part, index) => {
    const [label, price] = part.split(":").map((s) => s.trim());
    return {
      id: `dose-${index}-${slugify(label || "strength")}`,
      label: label || `Strength ${index + 1}`,
      strength: label || `Strength ${index + 1}`,
      price: Number(price) || 0,
    };
  });
}

export function productFromPartial(input: Partial<Product> & { name: string }): Product {
  const name = input.name.trim();
  const id = input.id || slugify(name);
  return {
    id,
    slug: input.slug || id,
    name,
    shortName: input.shortName || name,
    category: input.category || "Wellness",
    form: input.form || "Capsule",
    summary: input.summary || "",
    description: input.description || input.summary || "",
    howToUse: input.howToUse || "",
    tags: input.tags || [],
    doses: input.doses?.length
      ? input.doses.map((dose, index) => ({
          id: dose.id || `dose-${index}`,
          label: dose.label,
          strength: dose.strength || dose.label,
          price: Number(dose.price) || 0,
        }))
      : [{ id: "dose-0", label: "Standard", strength: "Standard", price: 0 }],
    featured: Boolean(input.featured),
    requiresRx: input.requiresRx !== false,
  };
}

export function parseFormularyJson(text: string): Product[] {
  const data = JSON.parse(text) as unknown;
  const rows = Array.isArray(data) ? data : (data as { products?: unknown[] }).products;
  if (!Array.isArray(rows)) throw new Error("JSON must be an array of medications.");
  return rows.map((row) => productFromPartial(row as Product));
}

export function parseFormularyCsv(text: string): Product[] {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) throw new Error("CSV needs a header row and at least one medication.");
  const headers = splitCsv(lines[0]!).map((h) => h.toLowerCase());
  return lines.slice(1).map((line) => {
    const cols = splitCsv(line);
    const get = (name: string) => cols[headers.indexOf(name)] || "";
    return productFromPartial({
      name: get("name"),
      shortName: get("shortname") || get("short_name"),
      category: get("category"),
      form: get("form"),
      summary: get("summary"),
      description: get("description"),
      doses: parseDoses(get("doses")),
    });
  });
}

function splitCsv(line: string) {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (const char of line) {
    if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += char;
    }
  }
  out.push(cur.trim());
  return out;
}

export const SAMPLE_CSV = `name,shortName,category,form,doses,summary
IsoBalance Estradiol Cream,Estradiol Cream,Hormone Therapy,Cream,0.25 mg/g:48|0.5 mg/g:56|1 mg/g:64,Bioidentical estradiol cream
IsoCalm Progesterone Capsules,Progesterone Capsules,Women's Health,Capsule,50 mg:42|100 mg:52|200 mg:68,Micronized progesterone capsules
`;

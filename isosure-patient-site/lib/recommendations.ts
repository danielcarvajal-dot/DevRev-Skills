import { PRODUCTS } from "./products";
import type { Order, Product } from "./types";

const COMPLEMENTS: Record<string, string[]> = {
  "estradiol-cream": ["progesterone-caps", "dhea-caps", "pregnenolone"],
  "progesterone-caps": ["estradiol-cream", "melatonin-troche", "dhea-caps"],
  "testosterone-gel": ["dhea-caps", "sildenafil-troche", "pregnenolone"],
  "thyroid-combo": ["ldn-caps", "glutathione", "dhea-caps"],
  "ketoprofen-cream": ["gabapentin-topical", "diclofenac-gel"],
  "gabapentin-topical": ["ketoprofen-cream", "diclofenac-gel"],
  "diclofenac-gel": ["ketoprofen-cream", "gabapentin-topical"],
  "hydroquinone": ["tretinoin", "minoxidil"],
  "tretinoin": ["hydroquinone", "minoxidil"],
  "minoxidil": ["tretinoin"],
  "ldn-caps": ["glutathione", "nad-spray", "thyroid-combo"],
  "sildenafil-troche": ["testosterone-gel"],
  "melatonin-troche": ["progesterone-caps", "ldn-caps"],
  "glutathione": ["nad-spray", "ldn-caps"],
  "nad-spray": ["glutathione", "ldn-caps"],
};

export function purchasedProductIds(orders: Order[]) {
  return new Set(orders.flatMap((order) => order.items.map((item) => item.productId)));
}

export function suggestProducts(orders: Order[], limit = 4): Product[] {
  const purchased = purchasedProductIds(orders);
  const scores = new Map<string, number>();

  if (purchased.size === 0) {
    return PRODUCTS.filter((p) => p.featured).slice(0, limit);
  }

  const tagCounts = new Map<string, number>();
  const categoryCounts = new Map<string, number>();

  for (const id of purchased) {
    const product = PRODUCTS.find((p) => p.id === id);
    if (!product) continue;
    categoryCounts.set(product.category, (categoryCounts.get(product.category) ?? 0) + 2);
    for (const tag of product.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
    for (const complement of COMPLEMENTS[id] ?? []) {
      scores.set(complement, (scores.get(complement) ?? 0) + 5);
    }
  }

  for (const product of PRODUCTS) {
    if (purchased.has(product.id)) continue;
    let score = scores.get(product.id) ?? 0;
    score += categoryCounts.get(product.category) ?? 0;
    for (const tag of product.tags) {
      score += tagCounts.get(tag) ?? 0;
    }
    if (score > 0) scores.set(product.id, score);
  }

  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => PRODUCTS.find((p) => p.id === id))
    .filter((p): p is Product => p !== undefined && !purchased.has(p.id))
    .slice(0, limit);
}

export function reasonForSuggestion(product: Product, orders: Order[]) {
  const purchased = [...purchasedProductIds(orders)]
    .map((id) => PRODUCTS.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p));

  const complement = purchased.find((p) => COMPLEMENTS[p.id]?.includes(product.id));
  if (complement) {
    return `Often paired with ${complement.shortName}`;
  }

  const sameCategory = purchased.find((p) => p.category === product.category);
  if (sameCategory) {
    return `Because you refill ${sameCategory.shortName}`;
  }

  const sharedTag = purchased.find((p) => p.tags.some((tag) => product.tags.includes(tag)));
  if (sharedTag) {
    return `Related to your ${sharedTag.shortName} history`;
  }

  return "Popular with patients like you";
}

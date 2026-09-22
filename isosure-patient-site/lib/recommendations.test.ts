import assert from "node:assert/strict";
import test from "node:test";
import { reasonForSuggestion, suggestProducts } from "./recommendations";
import { seedDemoOrders } from "./demo-data";

test("suggests complementary compounds from purchase history", () => {
  const suggestions = suggestProducts(seedDemoOrders(), 4);
  const ids = suggestions.map((product) => product.id);
  assert.ok(ids.includes("dhea-caps") || ids.includes("melatonin-troche") || ids.includes("pregnenolone"));
  assert.ok(!ids.includes("estradiol-cream"));
  assert.ok(!ids.includes("progesterone-caps"));
  assert.ok(!ids.includes("ldn-caps"));
});

test("explains why a complement is suggested", () => {
  const reason = reasonForSuggestion(
    { id: "dhea-caps", shortName: "DHEA Capsules", category: "Hormone Therapy", tags: ["hrt"] } as never,
    seedDemoOrders(),
  );
  assert.match(reason, /paired|refill|Related|Popular/i);
});

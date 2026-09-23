import assert from "node:assert/strict";
import test from "node:test";
import {
  canAccessOps,
  canAccessProvider,
  canAccessQa,
  homePath,
  resolveLogin,
  userForAccount,
} from "./auth";
import { isCompleteProviderProfile } from "./provider-profile";

test("example usernames resolve to Operations, Provider, Quality, or the pharmacist hub", () => {
  assert.equal(resolveLogin("hkitner-Ops")?.home, "/ops");
  assert.equal(resolveLogin("hkitner-Provider")?.home, "/account");
  assert.equal(resolveLogin("hkitner-QA")?.home, "/qa");
  assert.equal(resolveLogin("hkitner-RPh")?.home, "/hub");
  assert.equal(resolveLogin("HKITNER-ops")?.label, "Operations");
  assert.equal(resolveLogin("unknown"), null);
});

test("pharmacist account can open every portal; others stay on their lane", () => {
  const ops = userForAccount(resolveLogin("hkitner-Ops")!);
  const provider = userForAccount(resolveLogin("hkitner-Provider")!);
  const qa = userForAccount(resolveLogin("hkitner-QA")!);
  const rph = userForAccount(resolveLogin("hkitner-RPh")!);

  assert.equal(homePath(ops), "/ops");
  assert.equal(homePath(provider), "/account");
  assert.equal(homePath(qa), "/qa");
  assert.equal(homePath(rph), "/hub");

  assert.equal(canAccessOps(ops), true);
  assert.equal(canAccessProvider(ops), false);
  assert.equal(canAccessQa(ops), false);

  assert.equal(canAccessProvider(provider), true);
  assert.equal(canAccessOps(provider), false);

  assert.equal(canAccessQa(qa), true);
  assert.equal(canAccessOps(qa), false);

  assert.equal(canAccessOps(rph), true);
  assert.equal(canAccessProvider(rph), true);
  assert.equal(canAccessQa(rph), true);
  assert.equal(provider.role === "doctor" && isCompleteProviderProfile(provider), true);
});

/**
 * Beyond-use dating engine for Operations.
 *
 * Defaults follow USP <795> (2023) nonsterile and USP <797> (2023) sterile
 * category tables when no in-house stability study is on file. The engine
 * always caps the result by the earliest ingredient expiration.
 *
 * This module is Operations-only. The provider portal must not call it.
 */
import type { BudInput, BudResult, BudVehicle, StorageCondition } from "./lims-types";

const HOUR = 1000 * 60 * 60;
const DAY = 24;

function addHours(iso: string, hours: number) {
  return new Date(new Date(iso).getTime() + hours * HOUR).toISOString();
}

function hoursUntil(fromIso: string, toIso: string) {
  return Math.max(0, Math.floor((new Date(toIso).getTime() - new Date(fromIso).getTime()) / HOUR));
}

/** USP <795> default BUD in hours, with required storage. */
export function usp795Default(vehicle: BudVehicle, refrigerated: boolean) {
  switch (vehicle) {
    case "aqueous-unpreserved":
      return {
        hours: 14 * DAY,
        storage: "refrigerated" as StorageCondition,
        basis: "USP <795> default for non-preserved aqueous: 14 days refrigerated",
      };
    case "aqueous-preserved":
      return {
        hours: 35 * DAY,
        storage: (refrigerated ? "refrigerated" : "CRT") as StorageCondition,
        basis: "USP <795> default for preserved aqueous: 35 days CRT or refrigerated",
      };
    case "nonaqueous-liquid":
      return {
        hours: 90 * DAY,
        storage: "CRT" as StorageCondition,
        basis: "USP <795> default for nonaqueous oral liquids: 90 days CRT",
      };
    case "nonaqueous-solid":
      return {
        hours: 180 * DAY,
        storage: "CRT" as StorageCondition,
        basis: "USP <795> default for other nonaqueous dosage forms: 180 days CRT",
      };
  }
}

/** USP <797> category BUD in hours. */
export function usp797Default(input: {
  sterileCategory: 1 | 2 | 3;
  startingComponentsSterile: boolean;
  sterilityTested: boolean;
  refrigerated: boolean;
  frozen: boolean;
}) {
  const storage: StorageCondition = input.frozen ? "frozen" : input.refrigerated ? "refrigerated" : "CRT";
  if (input.sterileCategory === 1) {
    const hours = input.refrigerated || input.frozen ? 24 : 12;
    return {
      hours,
      storage: input.frozen ? ("refrigerated" as StorageCondition) : storage === "CRT" ? storage : "refrigerated",
      basis: `USP <797> Category 1: ${hours} hours (${storage === "CRT" ? "CRT" : "refrigerated"})`,
    };
  }

  const table = category2or3(input.sterileCategory, input.startingComponentsSterile, input.sterilityTested);
  const hours = table[storage] * DAY;
  return {
    hours,
    storage,
    basis: `USP <797> Category ${input.sterileCategory} (${input.startingComponentsSterile ? "sterile" : "nonsterile"} start${input.sterilityTested ? ", sterility tested" : ""}): ${table[storage]} days ${storage}`,
  };
}

function category2or3(
  category: 2 | 3,
  sterileStart: boolean,
  tested: boolean,
): Record<StorageCondition, number> {
  if (category === 2) {
    if (sterileStart && !tested) return { CRT: 4, refrigerated: 10, frozen: 45 };
    if (sterileStart && tested) return { CRT: 30, refrigerated: 45, frozen: 60 };
    if (!sterileStart && !tested) return { CRT: 1, refrigerated: 4, frozen: 9 };
    return { CRT: 14, refrigerated: 28, frozen: 45 };
  }
  if (tested) return { CRT: 90, refrigerated: 120, frozen: 180 };
  return { CRT: 60, refrigerated: 90, frozen: 120 };
}

export function calculateBud(input: BudInput): BudResult {
  const compoundedAt = input.compoundedAt || new Date().toISOString();
  let chapterResult: { hours: number; storage: StorageCondition; basis: string };
  if (input.chapter === "797") {
    chapterResult = usp797Default({
      sterileCategory: input.sterileCategory || 1,
      startingComponentsSterile: Boolean(input.startingComponentsSterile),
      sterilityTested: Boolean(input.sterilityTested),
      refrigerated: Boolean(input.refrigerated),
      frozen: Boolean(input.frozen),
    });
  } else {
    const vehicle = input.vehicle || "aqueous-preserved";
    chapterResult = usp795Default(vehicle, Boolean(input.refrigerated));
    if (vehicle === "aqueous-unpreserved") {
      chapterResult.storage = "refrigerated";
    }
  }

  let hours = chapterResult.hours;
  let basis = chapterResult.basis;
  let cappedBy: BudResult["cappedBy"] = "chapter";
  const storage = chapterResult.storage;

  if (input.stabilityDays != null && input.stabilityDays > 0) {
    const stabilityHours = input.stabilityDays * DAY;
    if (stabilityHours < hours) {
      hours = stabilityHours;
      basis = `In-house stability study: ${input.stabilityDays} days (shorter than chapter default)`;
      cappedBy = "stability";
    }
  }

  const expiries = (input.ingredientExpires || []).filter(Boolean);
  if (expiries.length) {
    const earliest = expiries.reduce((a, b) => (new Date(a) < new Date(b) ? a : b));
    const untilExpiry = hoursUntil(compoundedAt, earliest);
    if (untilExpiry < hours) {
      hours = untilExpiry;
      basis = `Capped by earliest ingredient expiration (${new Date(earliest).toISOString().slice(0, 10)})`;
      cappedBy = "ingredient";
    }
  }

  return {
    hours,
    date: addHours(compoundedAt, hours),
    storage,
    basis,
    cappedBy,
    chapter: input.chapter,
  };
}

export function potencyAdjustedQty(formulaQty: number, potencyPct: number) {
  const pct = potencyPct > 0 ? potencyPct : 100;
  return Math.round((formulaQty * (100 / pct) + Number.EPSILON) * 1000) / 1000;
}

export function daysFromHours(hours: number) {
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"}`;
  const days = Math.round((hours / 24) * 10) / 10;
  return `${days} day${days === 1 ? "" : "s"}`;
}

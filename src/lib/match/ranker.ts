import { distanceMiles, findTown } from "@/lib/geo";
import { SPECIES_LABELS, formatUsd, type Lodge } from "@/lib/types";
import type { HuntCriteria, LodgeRanker, MatchResult } from "./types";

/**
 * Point values for the rules-based scorer. Tweak these and re-run `npm test`
 * to see how rankings change.
 */
export const WEIGHTS = {
  // Points earned when a lodge fits (these also set the max possible score).
  wildBirds: 10,
  budgetFits: 20,
  dogsOk: 10,
  groupFits: 5,
  styleMatch: 8,
  regionMatch: 7,
  packageLengthMatch: 5,
  /** Full points in town, sliding to 0 at MAX_MILES away. */
  distance: 15,
  // Partial credit / penalties when it doesn't fit.
  budgetSlightlyOver: 5, // within 15% of budget
  budgetOver: -20,
  notWild: -10,
  dogsNotAllowed: -20,
  groupTooBig: -25,
  styleMismatch: -15,
  regionMismatch: -15,
} as const;

/** Beyond this many miles from the requested town, a lodge gets no distance points. */
export const MAX_MILES = 150;

/** Estimated cost per person for `days` days, scaled from the lodge's package price. */
export function estimateCostPerPerson(lodge: Lodge, days?: number): number {
  if (!days || days === lodge.packageDays) return lodge.pricePerPerson;
  return Math.round((lodge.pricePerPerson / lodge.packageDays) * days);
}

/** Budget converted to per person (assumes per person if the hunter didn't say). */
export function budgetPerPerson(c: HuntCriteria): number | undefined {
  if (c.budget === undefined) return undefined;
  if (c.budgetBasis === "total" && c.groupSize && c.groupSize > 0) return c.budget / c.groupSize;
  return c.budget;
}

/** Score one lodge. Returns null if the lodge doesn't offer the requested species at all. */
export function scoreLodge(c: HuntCriteria, lodge: Lodge): MatchResult | null {
  const reasons: string[] = [];
  const warnings: string[] = [];
  // "earned" = points this lodge got; "possible" = points a perfect lodge would get
  // for this request. Final score = earned / possible, as 0-100.
  let earned = 0;
  let possible = 0;

  // 1. Species is a hard requirement: no pheasants = not a pheasant lodge.
  if (c.species.length > 0) {
    const matched = c.species.filter((s) => lodge.species.includes(s));
    if (matched.length === 0) return null;
    const names = matched.map((s) => SPECIES_LABELS[s].toLowerCase()).join(" & ");
    const wild = c.wildBirds && lodge.wildBirds ? "wild " : "";
    reasons.push(`Offers ${wild}${names}`);
  }

  // 2. Wild vs released birds.
  if (c.wildBirds) {
    possible += WEIGHTS.wildBirds;
    if (lodge.wildBirds) earned += WEIGHTS.wildBirds;
    else {
      earned += WEIGHTS.notWild;
      warnings.push("Released/preserve birds, not wild");
    }
  }

  // 3. Budget.
  const est = estimateCostPerPerson(lodge, c.days);
  const perPersonBudget = budgetPerPerson(c);
  if (perPersonBudget !== undefined) {
    possible += WEIGHTS.budgetFits;
    const assumed = c.budgetBasis === "unspecified" ? " (assumed per person)" : "";
    if (est <= perPersonBudget) {
      earned += WEIGHTS.budgetFits;
      reasons.push(`${formatUsd(est)}/person fits your ${formatUsd(perPersonBudget)} budget${assumed}`);
    } else if (est <= perPersonBudget * 1.15) {
      earned += WEIGHTS.budgetSlightlyOver;
      warnings.push(`Slightly over budget: ${formatUsd(est)}/person vs ${formatUsd(perPersonBudget)}${assumed}`);
    } else {
      earned += WEIGHTS.budgetOver;
      warnings.push(`Over budget: ${formatUsd(est)}/person vs ${formatUsd(perPersonBudget)}${assumed}`);
    }
  }

  // 4. Dogs.
  if (c.dogs === true) {
    possible += WEIGHTS.dogsOk;
    if (lodge.dogsAllowed) {
      earned += WEIGHTS.dogsOk;
      reasons.push("Your dogs are welcome");
    } else {
      earned += WEIGHTS.dogsNotAllowed;
      warnings.push("Does not allow your own dogs");
    }
  }

  // 5. Group size.
  if (c.groupSize) {
    possible += WEIGHTS.groupFits;
    if (lodge.maxGroupSize >= c.groupSize) {
      earned += WEIGHTS.groupFits;
      reasons.push(`Takes groups up to ${lodge.maxGroupSize}`);
    } else {
      earned += WEIGHTS.groupTooBig;
      warnings.push(`Only takes groups up to ${lodge.maxGroupSize}`);
    }
  }

  // 6. Guided vs DIY.
  if (c.style) {
    possible += WEIGHTS.styleMatch;
    if (lodge.huntStyle === c.style || lodge.huntStyle === "BOTH") {
      earned += WEIGHTS.styleMatch;
      reasons.push(c.style === "GUIDED" ? "Guided hunts" : "DIY hunts");
    } else {
      earned += WEIGHTS.styleMismatch;
      warnings.push(lodge.huntStyle === "GUIDED" ? "Guided only" : "DIY only");
    }
  }

  // 7. East vs West River.
  if (c.region) {
    possible += WEIGHTS.regionMatch;
    if (lodge.region === c.region) earned += WEIGHTS.regionMatch;
    else {
      earned += WEIGHTS.regionMismatch;
      warnings.push(`Wrong side of the river (${lodge.region === "EAST_RIVER" ? "East" : "West"} River)`);
    }
  }

  // 8. Package length.
  if (c.days) possible += WEIGHTS.packageLengthMatch;
  if (c.days && lodge.packageDays === c.days) {
    earned += WEIGHTS.packageLengthMatch;
    reasons.push(`Has a ${c.days}-day package`);
  }

  // 9. Distance to the requested town.
  let miles: number | undefined;
  const town = c.nearTown ? findTown(c.nearTown) : undefined;
  if (town) {
    miles = Math.round(distanceMiles(town.lat, town.lng, lodge.lat, lodge.lng));
    possible += WEIGHTS.distance;
    earned += WEIGHTS.distance * Math.max(0, 1 - miles / MAX_MILES);
    const where = miles < 5 ? `In ${town.name}` : `${miles} mi from ${town.name}`;
    if (miles <= 120) reasons.push(where);
    else warnings.push(`Far: ${where}`);
  }

  const score = possible === 0 ? 100 : Math.round((100 * Math.max(0, earned)) / possible);
  const summary = [reasons.slice(0, 3).join(", "), warnings[0] ? `but ${warnings[0].toLowerCase()}` : ""]
    .filter(Boolean)
    .join(" — ");

  return {
    lodge,
    score,
    reasons,
    warnings,
    summary: summary || "Matches your search",
    estimatedCostPerPerson: est,
    distanceMiles: miles,
  };
}

/** Pure function: rank lodges best-first. Ties break by price, then name. */
export function rankLodges(c: HuntCriteria, lodges: Lodge[]): MatchResult[] {
  return lodges
    .map((l) => scoreLodge(c, l))
    .filter((r): r is MatchResult => r !== null)
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.estimatedCostPerPerson - b.estimatedCostPerPerson ||
        a.lodge.name.localeCompare(b.lodge.name),
    );
}

export class RuleBasedLodgeRanker implements LodgeRanker {
  async rank(criteria: HuntCriteria, lodges: Lodge[]): Promise<MatchResult[]> {
    return rankLodges(criteria, lodges);
  }
}

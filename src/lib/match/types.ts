import type { Lodge, Region, Species } from "@/lib/types";

/** What the hunter asked for, pulled out of their free-text request. */
export interface HuntCriteria {
  /** The original text, kept for display. */
  rawText: string;
  species: Species[];
  days?: number;
  groupSize?: number;
  /** Budget in USD. See budgetBasis for whether it is per person or for the group. */
  budget?: number;
  /** "unspecified" means the hunter didn't say; the ranker assumes per person. */
  budgetBasis?: "per_person" | "total" | "unspecified";
  /** true = bringing our own dogs, false = no dogs. undefined = didn't say. */
  dogs?: boolean;
  style?: "GUIDED" | "DIY";
  region?: Region;
  /** true = wants wild (not released/preserve) birds. */
  wildBirds?: boolean;
  nearTown?: string;
}

/** One ranked lodge with the reasons it did (or didn't) fit. */
export interface MatchResult {
  lodge: Lodge;
  /** 0-100, higher is a better fit. */
  score: number;
  /** Things that fit the request, e.g. "Wild pheasant", "12 mi from Winner". */
  reasons: string[];
  /** Things that don't fit, e.g. "Over budget by $500 per person". */
  warnings: string[];
  /** One short sentence for the results list. */
  summary: string;
  /** Estimated cost per person for the requested number of days. */
  estimatedCostPerPerson: number;
  distanceMiles?: number;
}

/**
 * Turns free text into criteria.
 * Today: rules/regex (RuleBasedHuntParser). Later: an LLM version can implement
 * this same interface - but must return the same structured HuntCriteria.
 */
export interface HuntParser {
  parse(text: string): Promise<HuntCriteria>;
}

/**
 * Scores and sorts lodges for some criteria.
 * An LLM ranker can implement this later, but reasons must only use real lodge
 * fields (no invented prices/acres).
 */
export interface LodgeRanker {
  rank(criteria: HuntCriteria, lodges: Lodge[]): Promise<MatchResult[]>;
}

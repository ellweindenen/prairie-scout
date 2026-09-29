import type { Lodge } from "@/lib/types";
import { RuleBasedHuntParser } from "./parser";
import { RuleBasedLodgeRanker } from "./ranker";
import type { HuntCriteria, HuntParser, LodgeRanker, MatchResult } from "./types";

export * from "./types";
export { parseHuntRequest, RuleBasedHuntParser } from "./parser";
export { rankLodges, scoreLodge, estimateCostPerPerson, RuleBasedLodgeRanker, WEIGHTS } from "./ranker";

/**
 * Main entry point: free text + lodges -> criteria + ranked results.
 * Swap in an LLM parser/ranker later by passing different implementations.
 */
export async function matchHunt(
  text: string,
  lodges: Lodge[],
  parser: HuntParser = new RuleBasedHuntParser(),
  ranker: LodgeRanker = new RuleBasedLodgeRanker(),
): Promise<{ criteria: HuntCriteria; results: MatchResult[] }> {
  const criteria = await parser.parse(text);
  const results = await ranker.rank(criteria, lodges);
  return { criteria, results };
}

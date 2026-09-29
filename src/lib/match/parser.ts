import { SD_TOWNS } from "@/lib/geo";
import type { Species } from "@/lib/types";
import type { HuntCriteria, HuntParser } from "./types";

const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8,
  nine: 9, ten: 10, eleven: 11, twelve: 12, a: 1, an: 1, couple: 2,
};
const NUM = "(\\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|a|an|couple)";

function toNumber(word: string): number {
  const n = Number(word);
  return Number.isFinite(n) ? n : NUMBER_WORDS[word.toLowerCase()] ?? NaN;
}

// Order matters a little: more specific phrases first.
const SPECIES_KEYWORDS: Array<[RegExp, Species[]]> = [
  [/\bpheasants?\b|\broosters?\b|\bringnecks?\b/, ["PHEASANT"]],
  [/\bprairie chickens?\b/, ["PRAIRIE_CHICKEN"]],
  [/\bgrouse\b|\bsharp-?tails?\b/, ["GROUSE"]],
  [/\bducks?\b|\bgeese\b|\bgoose\b|\bwaterfowl\b/, ["WATERFOWL"]],
  [/\bwhite-?tails?\b/, ["WHITETAIL"]],
  [/\bmule deer\b|\bmuleys?\b/, ["MULE_DEER"]],
  [/\bturkeys?\b/, ["TURKEY"]],
  [/\bantelope\b|\bpronghorns?\b/, ["ANTELOPE"]],
  [/\bupland\b/, ["PHEASANT", "GROUSE", "PRAIRIE_CHICKEN"]],
];

function parseSpecies(t: string): Species[] {
  const found = new Set<Species>();
  for (const [re, species] of SPECIES_KEYWORDS) {
    if (re.test(t)) species.forEach((s) => found.add(s));
  }
  // Plain "deer" (without whitetail/mule) means either kind.
  if (/\bdeer\b/.test(t) && !found.has("WHITETAIL") && !found.has("MULE_DEER")) {
    found.add("WHITETAIL");
    found.add("MULE_DEER");
  }
  return [...found];
}

function parseDays(t: string): number | undefined {
  const m = t.match(new RegExp(`\\b${NUM}[\\s-]*days?\\b`));
  if (m) return toNumber(m[1]);
  if (/\bweekend\b/.test(t)) return 2;
  return undefined;
}

function parseGroupSize(t: string): number | undefined {
  if (/\b(just me|solo|by myself)\b/.test(t)) return 1;
  const m =
    t.match(new RegExp(`\\b${NUM}\\s+(guys|people|hunters|men|women|friends|buddies|of us|persons|adults|shooters|guns)\\b`)) ??
    t.match(new RegExp(`\\b(?:party|group) of\\s+${NUM}\\b`));
  if (m) {
    const n = toNumber(m[1]);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function parseBudget(t: string): Pick<HuntCriteria, "budget" | "budgetBasis"> {
  // "under $2,500", "budget of 2500", "max $3k", "$2,500" ...
  const m =
    t.match(/(?:under|below|less than|max(?:imum)?|up to|no more than|budget(?: of| is)?|around|about)\s*\$?\s*(\d[\d,]*(?:\.\d+)?)\s*(k)?\b/) ??
    t.match(/\$\s*(\d[\d,]*(?:\.\d+)?)\s*(k)?\b/);
  if (!m) return {};
  let amount = Number(m[1].replace(/,/g, ""));
  if (m[2]) amount *= 1000;
  // Ignore tiny numbers like "about 4" - those are not budgets.
  if (!Number.isFinite(amount) || amount < 100) return {};

  let budgetBasis: HuntCriteria["budgetBasis"] = "unspecified";
  if (/\b(per person|per guy|per hunter|each|apiece|a head|per head|pp)\b/.test(t)) budgetBasis = "per_person";
  else if (/\b(total|for the group|for everyone|for all of us|altogether|all in)\b/.test(t)) budgetBasis = "total";
  return { budget: amount, budgetBasis };
}

function parseDogs(t: string): boolean | undefined {
  if (/\bno dogs?\b|\bwithout (?:a |our |my )?dogs?\b|\bdon'?t have (?:a )?dogs?\b/.test(t)) return false;
  if (/\bdogs?\b|\blabs?\b|\bpointers?\b/.test(t)) return true;
  return undefined;
}

function parseStyle(t: string): HuntCriteria["style"] {
  // Check DIY first because "self-guided" contains the word "guided".
  if (/\bdiy\b|\bself[- ]guided\b|\bunguided\b|\bon our own\b|\bdo it yourself\b/.test(t)) return "DIY";
  if (/\bguided\b|\bwith a guide\b|\bguide\b/.test(t)) return "GUIDED";
  return undefined;
}

function parseRegion(t: string): HuntCriteria["region"] {
  if (/\beast[- ]river\b/.test(t)) return "EAST_RIVER";
  if (/\bwest[- ]river\b/.test(t)) return "WEST_RIVER";
  return undefined;
}

function parseTown(t: string): string | undefined {
  // Prefer a town that follows "near/around/by/in", otherwise any known town.
  let best: { name: string; index: number; preferred: boolean } | undefined;
  for (const town of SD_TOWNS) {
    const re = new RegExp(`(near|around|close to|outside(?: of)?|by|in)?\\s*\\b${town.name.toLowerCase()}\\b`);
    const m = t.match(re);
    if (!m || m.index === undefined) continue;
    const candidate = { name: town.name, index: m.index, preferred: Boolean(m[1]) };
    if (!best || (candidate.preferred && !best.preferred) || (candidate.preferred === best.preferred && candidate.index < best.index)) {
      best = candidate;
    }
  }
  return best?.name;
}

/** Pure function: free text -> structured criteria. Deterministic, no network. */
export function parseHuntRequest(text: string): HuntCriteria {
  const t = text.toLowerCase().replace(/[“”]/g, '"').replace(/[’]/g, "'");
  const criteria: HuntCriteria = {
    rawText: text,
    species: parseSpecies(t),
    days: parseDays(t),
    groupSize: parseGroupSize(t),
    ...parseBudget(t),
    dogs: parseDogs(t),
    style: parseStyle(t),
    region: parseRegion(t),
    wildBirds: /\bwild\b/.test(t) ? true : undefined,
    nearTown: parseTown(t),
  };
  return criteria;
}

export class RuleBasedHuntParser implements HuntParser {
  async parse(text: string): Promise<HuntCriteria> {
    return parseHuntRequest(text);
  }
}

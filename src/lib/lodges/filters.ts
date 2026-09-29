import { REGIONS, SPECIES, type HuntStyle, type Lodge, type Region, type Species } from "@/lib/types";

/** Filters for the lodge list page. Every field is optional; empty = no filter. */
export interface LodgeFilters {
  species?: Species;
  region?: Region;
  /** "GUIDED" or "DIY". Lodges offering BOTH match either. */
  style?: Exclude<HuntStyle, "BOTH">;
  /** true = only lodges where you can bring your own dogs. */
  dogs?: boolean;
  /** Max price per person for the package, in USD. */
  maxPrice?: number;
}

type RawParams = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

/** Turn URL search params (?species=PHEASANT&dogs=1...) into safe, typed filters. */
export function parseFilters(params: RawParams): LodgeFilters {
  const filters: LodgeFilters = {};

  const species = first(params.species);
  if (species && (SPECIES as readonly string[]).includes(species)) filters.species = species as Species;

  const region = first(params.region);
  if (region && (REGIONS as readonly string[]).includes(region)) filters.region = region as Region;

  const style = first(params.style);
  if (style === "GUIDED" || style === "DIY") filters.style = style;

  const dogs = first(params.dogs);
  if (dogs === "1" || dogs === "true" || dogs === "on") filters.dogs = true;

  const maxPrice = Number(first(params.maxPrice));
  if (Number.isFinite(maxPrice) && maxPrice > 0) filters.maxPrice = maxPrice;

  return filters;
}

/** Keep only lodges that pass every filter that is set. */
export function filterLodges(lodges: Lodge[], f: LodgeFilters): Lodge[] {
  return lodges.filter((l) => {
    if (f.species && !l.species.includes(f.species)) return false;
    if (f.region && l.region !== f.region) return false;
    if (f.style && l.huntStyle !== f.style && l.huntStyle !== "BOTH") return false;
    if (f.dogs && !l.dogsAllowed) return false;
    if (f.maxPrice !== undefined && l.pricePerPerson > f.maxPrice) return false;
    return true;
  });
}

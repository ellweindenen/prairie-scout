// Shared app types. These mirror prisma/schema.prisma but are plain TypeScript,
// so the matcher, filters and tests work without a database.

export const SPECIES = [
  "PHEASANT",
  "GROUSE",
  "PRAIRIE_CHICKEN",
  "WATERFOWL",
  "WHITETAIL",
  "MULE_DEER",
  "TURKEY",
  "ANTELOPE",
] as const;
export type Species = (typeof SPECIES)[number];

export const REGIONS = ["EAST_RIVER", "WEST_RIVER"] as const;
export type Region = (typeof REGIONS)[number];

export const HUNT_STYLES = ["GUIDED", "DIY", "BOTH"] as const;
export type HuntStyle = (typeof HUNT_STYLES)[number];

export interface Lodge {
  id: string;
  name: string;
  isSample: boolean;
  description: string;
  species: Species[];
  region: Region;
  huntStyle: HuntStyle;
  wildBirds: boolean;
  dogsAllowed: boolean;
  /** USD per person for the whole package (see packageDays). */
  pricePerPerson: number;
  /** What the price covers, e.g. "lodging, meals, guide". */
  priceNotes: string;
  packageDays: number;
  town: string;
  county: string;
  lat: number;
  lng: number;
  maxGroupSize: number;
  sourceUrl: string;
  /** ISO date string of the last hand check, or null if never verified. */
  lastChecked: string | null;
}

export const SPECIES_LABELS: Record<Species, string> = {
  PHEASANT: "Pheasant",
  GROUSE: "Sharp-tailed grouse",
  PRAIRIE_CHICKEN: "Prairie chicken",
  WATERFOWL: "Waterfowl",
  WHITETAIL: "Whitetail deer",
  MULE_DEER: "Mule deer",
  TURKEY: "Turkey",
  ANTELOPE: "Antelope",
};

export const REGION_LABELS: Record<Region, string> = {
  EAST_RIVER: "East River",
  WEST_RIVER: "West River",
};

export const HUNT_STYLE_LABELS: Record<HuntStyle, string> = {
  GUIDED: "Guided",
  DIY: "DIY",
  BOTH: "Guided or DIY",
};

export function formatUsd(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-US");
}

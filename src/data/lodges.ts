import data from "./lodges.json";

export type Lodge = {
  id: number;
  name: string;
  state: "SD" | "ND" | "NE";
  city: string;
  lat: number;
  lng: number;
  species: string[];
  phone: string;
  description: string;
  amenities: string[];
  website: string;
  photo?: string;
  /** ISO date the listing was last checked against a public source. */
  verified?: string;
  /** Shown when the pin is approximate. */
  locationNote?: string;
};

export const lodges = data as Lodge[];

export const STATE_LABEL: Record<Lodge["state"], string> = {
  SD: "South Dakota",
  ND: "North Dakota",
  NE: "Nebraska",
};

/** "Whitetail" is a deer, so the Deer filter covers both labels. */
const SPECIES_ALIASES: Record<string, string[]> = { Deer: ["Deer", "Whitetail"] };

export function speciesOptions(list: Lodge[] = lodges): string[] {
  const all = new Set<string>();
  list.forEach((lodge) => lodge.species.forEach((s) => all.add(s === "Whitetail" ? "Deer" : s)));
  return [...all].sort((a, b) => a.localeCompare(b));
}

export function matchesSpecies(lodge: Lodge, filter: string): boolean {
  if (filter === "all") return true;
  const names = SPECIES_ALIASES[filter] ?? [filter];
  return lodge.species.some((s) => names.includes(s));
}

export function phoneHref(phone: string): string | null {
  const compact = phone.replace(/[^\d+]/g, "");
  const digits = compact.replace(/\D/g, "");
  if (digits.length < 7) return null;
  return `tel:${compact}`;
}

export function directionsHref(lodge: Lodge): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lodge.lat},${lodge.lng}`;
}

/** Great-circle distance in miles. */
export function milesBetween(a: [number, number], b: [number, number]): number {
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

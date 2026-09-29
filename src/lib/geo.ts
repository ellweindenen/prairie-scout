// Small geography helpers. Town coordinates are approximate town centers.

export interface Town {
  name: string;
  lat: number;
  lng: number;
}

/** South Dakota towns the matcher understands in "near <town>". Add more as needed. */
export const SD_TOWNS: Town[] = [
  { name: "Aberdeen", lat: 45.4647, lng: -98.4865 },
  { name: "Brookings", lat: 44.3114, lng: -96.7984 },
  { name: "Chamberlain", lat: 43.8108, lng: -99.3304 },
  { name: "Gregory", lat: 43.2322, lng: -99.4304 },
  { name: "Huron", lat: 44.3633, lng: -98.2143 },
  { name: "Kadoka", lat: 43.8336, lng: -101.5091 },
  { name: "Miller", lat: 44.5183, lng: -98.9887 },
  { name: "Mitchell", lat: 43.7094, lng: -98.0298 },
  { name: "Mobridge", lat: 45.5372, lng: -100.4279 },
  { name: "Murdo", lat: 43.8886, lng: -100.7118 },
  { name: "Philip", lat: 44.0394, lng: -101.6651 },
  { name: "Pierre", lat: 44.3683, lng: -100.351 },
  { name: "Platte", lat: 43.3869, lng: -98.8445 },
  { name: "Presho", lat: 43.9064, lng: -100.0593 },
  { name: "Rapid City", lat: 44.0805, lng: -103.231 },
  { name: "Redfield", lat: 44.875, lng: -98.519 },
  { name: "Sioux Falls", lat: 43.5446, lng: -96.7311 },
  { name: "Spearfish", lat: 44.4908, lng: -103.8594 },
  { name: "Watertown", lat: 44.8994, lng: -97.115 },
  { name: "Winner", lat: 43.3767, lng: -99.859 },
  { name: "Yankton", lat: 42.8711, lng: -97.3973 },
];

export function findTown(name: string): Town | undefined {
  const n = name.trim().toLowerCase();
  return SD_TOWNS.find((t) => t.name.toLowerCase() === n);
}

/** Straight-line distance in miles (haversine formula). */
export function distanceMiles(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 3958.8; // Earth radius in miles
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

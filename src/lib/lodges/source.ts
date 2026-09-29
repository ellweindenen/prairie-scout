import { SAMPLE_LODGES } from "@/data/sampleLodges";
import type { Lodge } from "@/lib/types";

export type DataSource = "database" | "sample";

export interface LodgeResult {
  lodges: Lodge[];
  source: DataSource;
}

/**
 * Load all lodges.
 * - If DATABASE_URL is set, read from Postgres via Prisma.
 * - If it is missing (or the DB is unreachable), fall back to the fake sample
 *   lodges so the app still works for demos and builds.
 */
export async function getAllLodges(): Promise<LodgeResult> {
  if (!process.env.DATABASE_URL) {
    return { lodges: SAMPLE_LODGES, source: "sample" };
  }
  try {
    const { prisma } = await import("@/lib/db");
    const rows = await prisma.lodge.findMany({ orderBy: { name: "asc" } });
    return {
      source: "database",
      lodges: rows.map((r) => ({
        id: r.id,
        name: r.name,
        isSample: r.isSample,
        description: r.description,
        species: r.species,
        region: r.region,
        huntStyle: r.huntStyle,
        wildBirds: r.wildBirds,
        dogsAllowed: r.dogsAllowed,
        pricePerPerson: r.pricePerPerson,
        priceNotes: r.priceNotes,
        packageDays: r.packageDays,
        town: r.town,
        county: r.county,
        lat: r.lat,
        lng: r.lng,
        maxGroupSize: r.maxGroupSize,
        sourceUrl: r.sourceUrl,
        lastChecked: r.lastChecked ? r.lastChecked.toISOString() : null,
      })),
    };
  } catch (err) {
    console.warn("[prairie-scout] Database unavailable, using sample lodges:", (err as Error).message);
    return { lodges: SAMPLE_LODGES, source: "sample" };
  }
}

export async function getLodgeById(id: string): Promise<Lodge | undefined> {
  const { lodges } = await getAllLodges();
  return lodges.find((l) => l.id === id);
}

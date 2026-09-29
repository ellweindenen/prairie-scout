import Link from "next/link";
import { LodgeFacts } from "@/components/LodgeFacts";
import { SampleBadge, SampleDataBanner } from "@/components/SampleBadge";
import { filterLodges, parseFilters } from "@/lib/lodges/filters";
import { getAllLodges } from "@/lib/lodges/source";
import { REGIONS, REGION_LABELS, SPECIES, SPECIES_LABELS } from "@/lib/types";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function LodgeListPage({ searchParams }: Props) {
  const params = await searchParams;
  const filters = parseFilters(params);
  const { lodges, source } = await getAllLodges();
  const shown = filterLodges(lodges, filters);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">South Dakota hunting lodges</h1>
      <p className="mb-4 text-stone-600">One list. Filter by the hunt you want, then compare.</p>
      <SampleDataBanner source={source} />

      {/* Filters: a plain GET form, so filters live in the URL and are easy to share. */}
      <form method="get" className="mb-6 grid grid-cols-2 gap-3 rounded border border-stone-200 bg-white p-4 md:grid-cols-6">
        <label className="flex flex-col text-sm">
          Species
          <select name="species" defaultValue={filters.species ?? ""} className="rounded border p-1">
            <option value="">Any</option>
            {SPECIES.map((s) => (
              <option key={s} value={s}>{SPECIES_LABELS[s]}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col text-sm">
          Region
          <select name="region" defaultValue={filters.region ?? ""} className="rounded border p-1">
            <option value="">Any</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>{REGION_LABELS[r]}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col text-sm">
          Guided / DIY
          <select name="style" defaultValue={filters.style ?? ""} className="rounded border p-1">
            <option value="">Either</option>
            <option value="GUIDED">Guided</option>
            <option value="DIY">DIY</option>
          </select>
        </label>
        <label className="flex flex-col text-sm">
          Max $/person
          <input name="maxPrice" type="number" min={0} step={50} defaultValue={filters.maxPrice ?? ""} className="rounded border p-1" />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input name="dogs" type="checkbox" value="1" defaultChecked={filters.dogs ?? false} />
          Bringing dogs
        </label>
        <div className="flex items-end gap-2">
          <button className="rounded bg-amber-700 px-3 py-1 text-white">Filter</button>
          <Link href="/" className="text-sm text-stone-500 underline">Clear</Link>
        </div>
      </form>

      {/* Compare: tick 2-3 lodges and submit to /compare?ids=... */}
      <form method="get" action="/compare">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm text-stone-600">{shown.length} of {lodges.length} lodges</p>
          <button className="rounded border border-amber-700 px-3 py-1 text-sm text-amber-800">
            Compare selected (2–3)
          </button>
        </div>
        <ul className="space-y-3">
          {shown.map((lodge) => (
            <li key={lodge.id} className="flex gap-3 rounded border border-stone-200 bg-white p-4">
              <input type="checkbox" name="ids" value={lodge.id} aria-label={`Compare ${lodge.name}`} className="mt-1" />
              <div>
                <div className="flex items-center gap-2">
                  <Link href={`/lodges/${lodge.id}`} className="font-semibold text-amber-900 hover:underline">
                    {lodge.name}
                  </Link>
                  {lodge.isSample && <SampleBadge />}
                </div>
                <LodgeFacts lodge={lodge} />
              </div>
            </li>
          ))}
          {shown.length === 0 && <li className="text-stone-500">No lodges match those filters.</li>}
        </ul>
      </form>
    </div>
  );
}

import Link from "next/link";
import { SampleBadge } from "@/components/SampleBadge";
import { getAllLodges } from "@/lib/lodges/source";
import { HUNT_STYLE_LABELS, REGION_LABELS, SPECIES_LABELS, formatUsd, type Lodge } from "@/lib/types";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ ids?: string | string[] }> };

const ROWS: Array<[string, (l: Lodge) => React.ReactNode]> = [
  ["Species", (l) => l.species.map((s) => SPECIES_LABELS[s]).join(", ")],
  ["Region", (l) => REGION_LABELS[l.region]],
  ["Hunt style", (l) => HUNT_STYLE_LABELS[l.huntStyle]],
  ["Wild birds", (l) => (l.wildBirds ? "Yes" : "No")],
  ["Your dogs", (l) => (l.dogsAllowed ? "Welcome" : "Not allowed")],
  ["Price / person", (l) => formatUsd(l.pricePerPerson)],
  ["Package", (l) => `${l.packageDays} days`],
  ["Price covers", (l) => l.priceNotes],
  ["Max group", (l) => l.maxGroupSize],
  ["Town", (l) => `${l.town} (${l.county} Co.)`],
  ["Last checked", (l) => (l.lastChecked ? new Date(l.lastChecked).toLocaleDateString("en-US") : "Not verified")],
];

export default async function ComparePage({ searchParams }: Props) {
  const { ids } = await searchParams;
  const wanted = (Array.isArray(ids) ? ids : ids ? ids.split(",") : []).slice(0, 3);
  const { lodges } = await getAllLodges();
  const selected = wanted.map((id) => lodges.find((l) => l.id === id)).filter((l): l is Lodge => Boolean(l));

  if (selected.length < 2) {
    return (
      <div>
        <h1 className="mb-2 text-2xl font-bold">Compare lodges</h1>
        <p className="text-stone-600">
          Pick 2 or 3 lodges on the <Link href="/" className="text-amber-800 underline">lodge list</Link>, then
          press “Compare selected”.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Compare lodges</h1>
      {wanted.length > selected.length && (
        <p className="mb-2 text-sm text-stone-500">Some selected lodges were not found.</p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white text-sm">
          <thead>
            <tr className="border-b border-stone-300">
              <th className="p-2" />
              {selected.map((l) => (
                <th key={l.id} className="p-2 text-left">
                  <Link href={`/lodges/${l.id}`} className="text-amber-900 hover:underline">{l.name}</Link>
                  {l.isSample && <div className="mt-1"><SampleBadge /></div>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map(([label, get]) => (
              <tr key={label} className="border-b border-stone-200">
                <th className="p-2 text-left font-medium text-stone-500">{label}</th>
                {selected.map((l) => (
                  <td key={l.id} className="p-2">{get(l)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

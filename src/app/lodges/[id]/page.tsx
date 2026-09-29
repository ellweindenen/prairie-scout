import Link from "next/link";
import { notFound } from "next/navigation";
import { SampleBadge } from "@/components/SampleBadge";
import { getLodgeById } from "@/lib/lodges/source";
import { HUNT_STYLE_LABELS, REGION_LABELS, SPECIES_LABELS, formatUsd } from "@/lib/types";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function LodgeDetailPage({ params }: Props) {
  const { id } = await params;
  const lodge = await getLodgeById(id);
  if (!lodge) notFound();

  const rows: Array<[string, React.ReactNode]> = [
    ["Species", lodge.species.map((s) => SPECIES_LABELS[s]).join(", ")],
    ["Region", REGION_LABELS[lodge.region]],
    ["Hunt style", HUNT_STYLE_LABELS[lodge.huntStyle]],
    ["Birds", lodge.wildBirds ? "Wild" : "Released / preserve or n/a"],
    ["Your dogs", lodge.dogsAllowed ? "Welcome" : "Not allowed"],
    ["Price", `${formatUsd(lodge.pricePerPerson)} per person for ${lodge.packageDays} days`],
    ["Price covers", lodge.priceNotes || "—"],
    ["Max group", `${lodge.maxGroupSize} hunters`],
    ["Location", `${lodge.town}, ${lodge.county} County`],
    [
      "Map",
      <a
        key="map"
        className="text-amber-800 underline"
        href={`https://www.openstreetmap.org/?mlat=${lodge.lat}&mlon=${lodge.lng}#map=11/${lodge.lat}/${lodge.lng}`}
      >
        {lodge.lat.toFixed(3)}, {lodge.lng.toFixed(3)} (approx.)
      </a>,
    ],
    [
      "Source",
      <a key="src" className="text-amber-800 underline" href={lodge.sourceUrl}>
        {lodge.sourceUrl}
      </a>,
    ],
    ["Last checked by hand", lodge.lastChecked ? new Date(lodge.lastChecked).toLocaleDateString("en-US") : "Not verified yet"],
  ];

  return (
    <div>
      <Link href="/" className="text-sm text-stone-500 underline">← All lodges</Link>
      <div className="mt-2 mb-2 flex items-center gap-2">
        <h1 className="text-2xl font-bold">{lodge.name}</h1>
        {lodge.isSample && <SampleBadge />}
      </div>
      <p className="mb-4 text-stone-600">{lodge.description}</p>
      <table className="w-full max-w-2xl border-collapse bg-white text-sm">
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label} className="border-b border-stone-200">
              <th className="w-48 p-2 text-left font-medium text-stone-500">{label}</th>
              <td className="p-2">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

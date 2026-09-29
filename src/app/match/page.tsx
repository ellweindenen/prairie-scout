import Link from "next/link";
import { SampleBadge, SampleDataBanner } from "@/components/SampleBadge";
import { getAllLodges } from "@/lib/lodges/source";
import { matchHunt } from "@/lib/match";
import { HUNT_STYLE_LABELS, SPECIES_LABELS, formatUsd } from "@/lib/types";

export const dynamic = "force-dynamic";

const EXAMPLE = "3-day wild pheasant hunt, 4 guys, dogs welcome, under $2,500, near Winner";

type Props = { searchParams: Promise<{ q?: string }> };

export default async function MatchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const text = (q ?? "").trim().slice(0, 500);
  const { lodges, source } = await getAllLodges();
  const match = text ? await matchHunt(text, lodges) : null;

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Type your hunt</h1>
      <p className="mb-4 text-stone-600">
        Say what you want in plain words. We rank lodges and show why each one matched.
        Don&apos;t include names, phone numbers or other personal info.
      </p>
      <SampleDataBanner source={source} />

      <form method="get" className="mb-6 flex flex-col gap-2">
        <textarea
          name="q"
          rows={3}
          defaultValue={text}
          placeholder={EXAMPLE}
          className="w-full rounded border border-stone-300 bg-white p-2"
        />
        <div className="flex items-center gap-3">
          <button className="rounded bg-amber-700 px-4 py-1 text-white">Find lodges</button>
          <Link href={`/match?q=${encodeURIComponent(EXAMPLE)}`} className="text-sm text-amber-800 underline">
            Try the example
          </Link>
        </div>
      </form>

      {match && (
        <>
          <section className="mb-4 rounded border border-stone-200 bg-white p-3 text-sm">
            <h2 className="mb-1 font-semibold">What we understood</h2>
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-stone-700">
              <li>Species: {match.criteria.species.map((s) => SPECIES_LABELS[s]).join(", ") || "any"}</li>
              {match.criteria.wildBirds && <li>Wild birds</li>}
              {match.criteria.days && <li>{match.criteria.days} days</li>}
              {match.criteria.groupSize && <li>{match.criteria.groupSize} hunters</li>}
              {match.criteria.budget !== undefined && (
                <li>
                  Budget {formatUsd(match.criteria.budget)}{" "}
                  {match.criteria.budgetBasis === "total" ? "total" : match.criteria.budgetBasis === "per_person" ? "per person" : "(assumed per person)"}
                </li>
              )}
              {match.criteria.dogs !== undefined && <li>{match.criteria.dogs ? "Bringing dogs" : "No dogs"}</li>}
              {match.criteria.style && <li>{match.criteria.style === "GUIDED" ? "Guided" : "DIY"}</li>}
              {match.criteria.region && <li>{match.criteria.region === "EAST_RIVER" ? "East River" : "West River"}</li>}
              {match.criteria.nearTown && <li>Near {match.criteria.nearTown}</li>}
            </ul>
          </section>

          <ol className="space-y-3">
            {match.results.map((r, i) => (
              <li key={r.lodge.id} className="rounded border border-stone-200 bg-white p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-lg font-bold text-stone-400">#{i + 1}</span>
                  <Link href={`/lodges/${r.lodge.id}`} className="font-semibold text-amber-900 hover:underline">
                    {r.lodge.name}
                  </Link>
                  {r.lodge.isSample && <SampleBadge />}
                  <span className="ml-auto rounded bg-amber-100 px-2 py-0.5 text-sm font-semibold text-amber-900">
                    {r.score}% fit
                  </span>
                </div>
                <p className="text-sm text-stone-600">
                  {HUNT_STYLE_LABELS[r.lodge.huntStyle]} · est. {formatUsd(r.estimatedCostPerPerson)}/person · {r.lodge.town}
                </p>
                <p className="mt-1 text-sm">
                  <strong>Why:</strong> {r.reasons.join(" · ") || "Matches your search"}
                </p>
                {r.warnings.length > 0 && (
                  <p className="mt-1 text-sm text-rose-700">
                    <strong>Watch out:</strong> {r.warnings.join(" · ")}
                  </p>
                )}
              </li>
            ))}
            {match.results.length === 0 && <li className="text-stone-500">No lodges offer that species yet.</li>}
          </ol>
        </>
      )}
    </div>
  );
}

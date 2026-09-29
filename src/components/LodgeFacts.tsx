import { HUNT_STYLE_LABELS, REGION_LABELS, SPECIES_LABELS, formatUsd, type Lodge } from "@/lib/types";

/** Small one-line facts about a lodge, reused on list and match pages. */
export function LodgeFacts({ lodge }: { lodge: Lodge }) {
  return (
    <p className="text-sm text-stone-600">
      {lodge.species.map((s) => SPECIES_LABELS[s]).join(", ")} · {REGION_LABELS[lodge.region]} ·{" "}
      {HUNT_STYLE_LABELS[lodge.huntStyle]} · {lodge.dogsAllowed ? "Dogs welcome" : "No outside dogs"} ·{" "}
      {formatUsd(lodge.pricePerPerson)}/person for {lodge.packageDays} days · {lodge.town}
    </p>
  );
}

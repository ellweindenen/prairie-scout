// Run the matcher from the command line against the sample lodges:
//   npm run match -- "3-day wild pheasant hunt, 4 guys, dogs welcome, under $2,500, near Winner"
import { SAMPLE_LODGES } from "../src/data/sampleLodges";
import { matchHunt } from "../src/lib/match";

const text =
  process.argv.slice(2).join(" ") ||
  "3-day wild pheasant hunt, 4 guys, dogs welcome, under $2,500, near Winner";

matchHunt(text, SAMPLE_LODGES).then(({ criteria, results }) => {
  console.log("Request:", text);
  console.log("Parsed criteria:", JSON.stringify({ ...criteria, rawText: undefined }, null, 2));
  console.log("\nRanked lodges (SAMPLE DATA):");
  results.forEach((r, i) => {
    console.log(`\n${i + 1}. ${r.lodge.name} (${r.lodge.town}) — score ${r.score}`);
    console.log(`   ${r.lodge.huntStyle} · est. $${r.estimatedCostPerPerson}/person`);
    console.log(`   Why: ${r.reasons.join("; ") || "-"}`);
    if (r.warnings.length) console.log(`   Watch out: ${r.warnings.join("; ")}`);
  });
});

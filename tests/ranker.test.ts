import { describe, expect, it } from "vitest";
import { SAMPLE_LODGES } from "@/data/sampleLodges";
import { matchHunt, parseHuntRequest, rankLodges, estimateCostPerPerson } from "@/lib/match";
import type { HuntParser } from "@/lib/match";

const PHEASANT_EXAMPLE = "3-day wild pheasant hunt, 4 guys, dogs welcome, under $2,500, near Winner";

describe("rankLodges", () => {
  it("ranks the pheasant example sensibly against the sample lodges", () => {
    const results = rankLodges(parseHuntRequest(PHEASANT_EXAMPLE), SAMPLE_LODGES);
    const names = results.map((r) => r.lodge.name);

    // Only pheasant lodges come back (E and F are deer/antelope only).
    expect(names).not.toContain("Sample Lodge E");
    expect(names).not.toContain("Sample Lodge F");
    expect(results).toHaveLength(6);

    // Lodge A is in Winner, wild birds, dogs OK, $2,100 -> best fit.
    expect(names[0]).toBe("Sample Lodge A");
    expect(names[1]).toBe("Sample Lodge B");
    expect(results[0].score).toBe(100);
    expect(results[0].reasons).toContain("In Winner");
    expect(results[0].reasons.join(" ")).toMatch(/wild pheasant/i);

    // Lodge C: preserve birds and no outside dogs -> near the bottom with warnings.
    const c = results.find((r) => r.lodge.id === "sample-c")!;
    expect(c.warnings).toContain("Does not allow your own dogs");
    expect(names.indexOf("Sample Lodge C")).toBeGreaterThan(2);

    // Lodge G is over budget and says so.
    const g = results.find((r) => r.lodge.id === "sample-g")!;
    expect(g.warnings.join(" ")).toMatch(/over budget/i);
  });

  it("gives every result a readable reason", () => {
    const results = rankLodges(parseHuntRequest(PHEASANT_EXAMPLE), SAMPLE_LODGES);
    for (const r of results) {
      expect(r.summary.length).toBeGreaterThan(5);
      expect(r.score).toBeGreaterThanOrEqual(0);
      expect(r.score).toBeLessThanOrEqual(100);
    }
  });

  it("penalizes lodges that are too small for the group", () => {
    const results = rankLodges(parseHuntRequest("pheasant hunt for 5 guys"), SAMPLE_LODGES);
    const h = results.find((r) => r.lodge.id === "sample-h")!;
    expect(h.warnings).toContain("Only takes groups up to 3");
    expect(results.at(-1)!.lodge.id).toBe("sample-h");
  });

  it("splits a total budget across the group", () => {
    // $4,000 total for 4 = $1,000 each: only the DIY lodge fits.
    const results = rankLodges(parseHuntRequest("2 day pheasant hunt, 4 guys, $4,000 total"), SAMPLE_LODGES);
    expect(results[0].lodge.id).toBe("sample-d");
  });

  it("prefers DIY lodges when asked for DIY deer", () => {
    const results = rankLodges(parseHuntRequest("DIY mule deer hunt west river"), SAMPLE_LODGES);
    expect(results.map((r) => r.lodge.id)).toEqual(["sample-f", "sample-e"]);
  });

  it("scales price to the requested number of days", () => {
    const d = SAMPLE_LODGES.find((l) => l.id === "sample-d")!; // $450 for 2 days
    expect(estimateCostPerPerson(d, 3)).toBe(675);
    expect(estimateCostPerPerson(d)).toBe(450);
  });
});

describe("matchHunt", () => {
  it("accepts a different parser (e.g. a future LLM parser)", async () => {
    const fakeParser: HuntParser = {
      parse: async (text) => ({ rawText: text, species: ["ANTELOPE"] }),
    };
    const { results } = await matchHunt("anything", SAMPLE_LODGES, fakeParser);
    expect(results.map((r) => r.lodge.id)).toEqual(["sample-f"]);
  });
});

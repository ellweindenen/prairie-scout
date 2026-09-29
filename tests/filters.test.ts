import { describe, expect, it } from "vitest";
import { SAMPLE_LODGES } from "@/data/sampleLodges";
import { filterLodges, parseFilters } from "@/lib/lodges/filters";

const ids = (f: Parameters<typeof filterLodges>[1]) => filterLodges(SAMPLE_LODGES, f).map((l) => l.id);

describe("filterLodges", () => {
  it("returns everything with no filters", () => {
    expect(ids({})).toHaveLength(SAMPLE_LODGES.length);
  });

  it("filters by species", () => {
    expect(ids({ species: "ANTELOPE" })).toEqual(["sample-f"]);
  });

  it("filters by region", () => {
    expect(ids({ region: "WEST_RIVER" })).toEqual(["sample-a", "sample-b", "sample-e", "sample-f"]);
  });

  it("guided/DIY filter includes lodges that offer both", () => {
    expect(ids({ style: "DIY" })).toEqual(["sample-b", "sample-d", "sample-f"]);
  });

  it("combines dogs and max price", () => {
    expect(ids({ species: "PHEASANT", dogs: true, maxPrice: 2000 })).toEqual(["sample-b", "sample-d", "sample-h"]);
  });
});

describe("parseFilters", () => {
  it("parses valid URL params", () => {
    expect(parseFilters({ species: "PHEASANT", region: "EAST_RIVER", style: "GUIDED", dogs: "1", maxPrice: "2500" })).toEqual({
      species: "PHEASANT",
      region: "EAST_RIVER",
      style: "GUIDED",
      dogs: true,
      maxPrice: 2500,
    });
  });

  it("ignores junk values", () => {
    expect(parseFilters({ species: "DRAGON", region: "north", style: "BOTH", maxPrice: "abc", dogs: "" })).toEqual({});
  });
});

describe("sample data safety", () => {
  it("every sample lodge is clearly marked as fake", () => {
    for (const l of SAMPLE_LODGES) {
      expect(l.isSample).toBe(true);
      expect(l.name).toMatch(/^Sample Lodge /);
      expect(l.sourceUrl).toMatch(/^https:\/\/example\.com/);
    }
  });
});

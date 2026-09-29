import { describe, expect, it } from "vitest";
import { parseHuntRequest } from "@/lib/match/parser";

describe("parseHuntRequest", () => {
  it("parses the pitch-deck pheasant example", () => {
    const c = parseHuntRequest("3-day wild pheasant hunt, 4 guys, dogs welcome, under $2,500, near Winner");
    expect(c.species).toEqual(["PHEASANT"]);
    expect(c.days).toBe(3);
    expect(c.groupSize).toBe(4);
    expect(c.budget).toBe(2500);
    expect(c.budgetBasis).toBe("unspecified");
    expect(c.dogs).toBe(true);
    expect(c.wildBirds).toBe(true);
    expect(c.nearTown).toBe("Winner");
    expect(c.style).toBeUndefined();
  });

  it("understands number words and a total budget", () => {
    const c = parseHuntRequest("two day duck hunt for six hunters, $3k total for the group");
    expect(c.species).toEqual(["WATERFOWL"]);
    expect(c.days).toBe(2);
    expect(c.groupSize).toBe(6);
    expect(c.budget).toBe(3000);
    expect(c.budgetBasis).toBe("total");
  });

  it("detects per-person budgets", () => {
    const c = parseHuntRequest("pheasants, max $1,800 per person");
    expect(c.budget).toBe(1800);
    expect(c.budgetBasis).toBe("per_person");
  });

  it("treats plain 'deer' as whitetail or mule deer", () => {
    expect(parseHuntRequest("west river deer hunt").species.sort()).toEqual(["MULE_DEER", "WHITETAIL"]);
    expect(parseHuntRequest("mule deer hunt").species).toEqual(["MULE_DEER"]);
  });

  it("reads region, guided vs DIY, and no dogs", () => {
    const c = parseHuntRequest("self-guided east river pheasant weekend, no dogs");
    expect(c.style).toBe("DIY");
    expect(c.region).toBe("EAST_RIVER");
    expect(c.dogs).toBe(false);
    expect(c.days).toBe(2);
    expect(parseHuntRequest("guided grouse hunt").style).toBe("GUIDED");
  });

  it("finds multi-word towns", () => {
    expect(parseHuntRequest("deer hunt near Rapid City").nearTown).toBe("Rapid City");
  });

  it("does not mistake small numbers for a budget", () => {
    const c = parseHuntRequest("about 4 of us want to hunt pheasants");
    expect(c.budget).toBeUndefined();
    expect(c.groupSize).toBe(4);
  });

  it("returns empty criteria for unrelated text", () => {
    const c = parseHuntRequest("hello there");
    expect(c.species).toEqual([]);
    expect(c.days).toBeUndefined();
    expect(c.nearTown).toBeUndefined();
  });
});

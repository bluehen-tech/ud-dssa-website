import { describe, expect, it } from "vitest";
import { pickFeaturedOpportunities } from "@/utils/opportunityTransforms";
import type { Opportunity } from "@/types/opportunity";

const NOW = new Date("2026-11-11T12:00:00Z");

function opportunity(id: string, postedDate: string, deadline?: string): Opportunity {
  return {
    id,
    title: id,
    organization: "UD",
    type: "job",
    description: "",
    postedDate,
    deadline,
  };
}

function pick(opportunities: Opportunity[], count = 3): string[] {
  return pickFeaturedOpportunities(opportunities, count, NOW).map((o) => o.id);
}

describe("pickFeaturedOpportunities", () => {
  it("shows open opportunities ahead of newer posts whose deadline has passed", () => {
    const picked = pick([
      opportunity("closed-new-1", "2026-11-01", "2026-11-05"),
      opportunity("closed-new-2", "2026-10-30", "2026-11-04"),
      opportunity("closed-new-3", "2026-10-29", "2026-11-03"),
      opportunity("open-old", "2026-06-01", "2026-12-01"),
      opportunity("open-no-deadline", "2026-05-01"),
    ]);

    expect(picked).toEqual(["open-old", "open-no-deadline", "closed-new-1"]);
  });

  it("orders open opportunities by newest post first", () => {
    const picked = pick([
      opportunity("older", "2026-09-01", "2026-12-15"),
      opportunity("newest", "2026-11-10"),
      opportunity("middle", "2026-10-01", "2026-11-20"),
    ]);

    expect(picked).toEqual(["newest", "middle", "older"]);
  });

  it("fills leftover slots with the most recently closed, leaving the oldest deadlines out", () => {
    const picked = pick([
      // Posted most recently, but its deadline is the oldest.
      opportunity("closed-2024", "2026-11-09", "2024-03-01"),
      opportunity("closed-last-week", "2026-08-01", "2026-11-04"),
      opportunity("closed-last-month", "2026-07-01", "2026-10-10"),
      opportunity("open", "2026-01-01", "2026-11-30"),
    ]);

    expect(picked).toEqual(["open", "closed-last-week", "closed-last-month"]);
  });

  it("treats a deadline later today as still open", () => {
    const picked = pick([
      opportunity("closes-tonight", "2026-10-01", "2026-11-11T23:00:00Z"),
      opportunity("closed-this-morning", "2026-11-10", "2026-11-11T09:00:00Z"),
    ]);

    expect(picked).toEqual(["closes-tonight", "closed-this-morning"]);
  });

  it("returns fewer than the requested count when there are not enough", () => {
    expect(pick([opportunity("only", "2026-11-01")])).toEqual(["only"]);
    expect(pick([])).toEqual([]);
  });
});

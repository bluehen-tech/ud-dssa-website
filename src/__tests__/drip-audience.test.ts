import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isContactSuppressed, resolveAudience } from "@/lib/drip-audience";

type Row = {
  id: string;
  email: string;
  status: string;
  source_metadata: { unsubscribed_lists?: string[] } | null;
};

/** Minimal chainable stand-in for the supabase-js query builder over an in-memory table. */
function fakeAdmin(rows: Row[]) {
  const queries: number[] = [];
  const admin = {
    from() {
      const builder: any = {
        select: () => builder,
        in: (_col: string, values: string[]) => {
          queries.push(values.length);
          return Promise.resolve({ data: rows.filter((r) => values.includes(r.email)), error: null });
        },
      };
      return builder;
    },
  } as unknown as SupabaseClient;
  return { admin, queries };
}

const contact = (id: string, patch: Partial<Row> = {}): Row => ({
  id,
  email: `${id}@udel.edu`,
  status: "subscribed",
  source_metadata: null,
  ...patch,
});

describe("isContactSuppressed", () => {
  it("honours global status and list-specific opt-outs", () => {
    expect(isContactSuppressed({ status: "unsubscribed" }, "event")).toBe(true);
    expect(isContactSuppressed({ status: "subscribed", source_metadata: { unsubscribed_lists: ["all"] } }, "event")).toBe(true);
    expect(isContactSuppressed({ status: "subscribed", source_metadata: { unsubscribed_lists: ["event"] } }, "event")).toBe(true);
    expect(isContactSuppressed({ status: "subscribed", source_metadata: { unsubscribed_lists: ["newsletter"] } }, "event")).toBe(false);
    expect(isContactSuppressed({ status: "subscribed", source_metadata: null }, "event")).toBe(false);
  });

  it("does not suppress an unknown contact (one-off sends to arbitrary addresses)", () => {
    expect(isContactSuppressed(null, "event")).toBe(false);
  });
});

describe("resolveAudience", () => {
  it("enrolls subscribed contacts and excludes unsubscribed / opted-out ones", async () => {
    const { admin } = fakeAdmin([
      contact("ok"),
      contact("global", { status: "unsubscribed" }),
      contact("all", { source_metadata: { unsubscribed_lists: ["all"] } }),
      contact("event", { source_metadata: { unsubscribed_lists: ["event"] } }),
      contact("newsletter-only", { source_metadata: { unsubscribed_lists: ["newsletter"] } }),
    ]);
    const lines = ["ok", "global", "all", "event", "newsletter-only"].map((id) => `${id}@udel.edu`);
    const audience = await resolveAudience(admin, lines, "event");

    expect(audience.members.map((m) => m.id).sort()).toEqual(["newsletter-only", "ok"]);
    expect(audience.suppressed).toBe(3);
    expect(audience.notFound).toEqual([]);
  });

  it("never enrolls addresses that are not contacts, and reports them", async () => {
    const { admin } = fakeAdmin([contact("known")]);
    const audience = await resolveAudience(admin, ["Known <KNOWN@udel.edu>", "stranger@example.com"], "event");
    expect(audience.members.map((m) => m.id)).toEqual(["known"]);
    expect(audience.notFound).toEqual(["stranger@example.com"]);
  });

  it("de-duplicates addresses and ignores unparseable lines", async () => {
    const { admin } = fakeAdmin([contact("a")]);
    const audience = await resolveAudience(admin, ["a@udel.edu", "A <a@udel.edu>", "garbage"], "event");
    expect(audience.members).toHaveLength(1);
    expect(audience.notFound).toEqual([]);
  });

  it("looks contacts up in chunks for large lists", async () => {
    const rows = Array.from({ length: 450 }, (_, i) => contact(`c${i}`));
    const { admin, queries } = fakeAdmin(rows);
    const audience = await resolveAudience(admin, rows.map((r) => r.email), "event");
    expect(audience.members).toHaveLength(450);
    expect(queries).toEqual([200, 200, 50]);
  });
});

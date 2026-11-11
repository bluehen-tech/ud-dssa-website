import { beforeEach, describe, expect, it } from "vitest";
import { runDripWorker, type WorkerDeps } from "@/lib/drip-worker";
import type { ProviderRequest, ProviderResult } from "@/lib/drip-provider";
import { FakeDripStore } from "./helpers/fake-drip-store";

type ProviderFn = (req: ProviderRequest, callNumber: number) => ProviderResult;
const ok: ProviderFn = (_req, n) => ({ kind: "ok", messageId: `msg-${n}` });

function setup(provider: ProviderFn = ok) {
  const store = new FakeDripStore();
  store.addStep(1, "2026-11-01T09:00:00Z");
  store.addStep(2, "2026-11-10T09:00:00Z");
  store.addStep(3, "2026-11-17T09:00:00Z");
  store.addRecipient("a");
  store.addRecipient("b");

  const calls: ProviderRequest[] = [];
  let impl = provider;
  const deps: WorkerDeps = {
    store,
    provider: async (req) => {
      calls.push(req);
      return impl(req, calls.length);
    },
    render: async ({ subject, bodyMarkdown }) => ({ text: `${subject}\n${bodyMarkdown}`, html: `<p>${bodyMarkdown}</p>` }),
    from: () => "DSSA Events <events@example.org>",
    replyTo: "dssa@example.org",
    now: () => store.now,
    sleep: async () => undefined,
  };
  return { store, deps, calls, setProvider: (p: ProviderFn) => (impl = p) };
}

const recipientsOf = (calls: ProviderRequest[]) => calls.map((c) => c.to).sort();

describe("drip worker: timing and de-duplication", () => {
  it("does not send before a step is due", async () => {
    const { store, deps, calls } = setup();
    store.now = new Date("2026-11-01T08:59:00Z");
    const summary = await runDripWorker(deps);
    expect(summary.claimed).toBe(0);
    expect(calls).toHaveLength(0);
  });

  it("sends each due step once per recipient, then waits for the next step", async () => {
    const { store, deps, calls } = setup();
    await runDripWorker(deps);
    expect(recipientsOf(calls)).toEqual(["a@udel.edu", "b@udel.edu"]);
    expect(store.enrollment("a").nextPosition).toBe(2);

    // Same instant again: step 1 is complete and step 2 is not due.
    await runDripWorker(deps);
    expect(calls).toHaveLength(2);

    store.now = new Date("2026-11-10T09:00:00Z");
    await runDripWorker(deps);
    expect(calls).toHaveLength(4);
    expect(calls.slice(2).every((c) => c.subject === "Step 2")).toBe(true);
  });

  it("completes the enrollment and campaign after the last step", async () => {
    const { store, deps } = setup();
    for (const t of ["2026-11-01T09:00:00Z", "2026-11-10T09:00:00Z", "2026-11-17T09:00:00Z"]) {
      store.now = new Date(t);
      await runDripWorker(deps);
    }
    expect(store.enrollment("a").status).toBe("completed");
    expect(store.campaign.status).toBe("completed");
    expect(store.sends.every((s) => s.status === "sent")).toBe(true);
  });

  it("concurrent workers never create duplicate attempts or send twice", async () => {
    const { store, deps, calls } = setup();
    await Promise.all([runDripWorker(deps), runDripWorker(deps), runDripWorker(deps)]);
    expect(calls).toHaveLength(2);
    expect(store.sends).toHaveLength(2);
    expect(new Set(calls.map((c) => c.idempotencyKey)).size).toBe(2);
  });

  it("skips events that already started", async () => {
    const { store, deps, calls } = setup();
    store.now = new Date("2026-11-21T00:00:00Z");
    store.addStep(4, "2026-11-20T00:00:00Z");
    store.steps = store.steps.filter((s) => s.position === 1);
    await runDripWorker(deps);
    expect(calls).toHaveLength(0);
    expect(store.sendsFor("a")[0].status).toBe("skipped");
    expect(store.enrollment("a").status).toBe("stopped");
  });
});

describe("drip worker: provider results", () => {
  it("updates only the affected attempt on rejection and advances the others", async () => {
    const { store, deps } = setup((req, n) =>
      req.to === "b@udel.edu" ? { kind: "rejected", detail: "HTTP 422: invalid address" } : ok(req, n)
    );
    const summary = await runDripWorker(deps);

    expect(summary.sent).toBe(1);
    expect(summary.failed).toBe(1);
    expect(store.sendsFor("a")[0]).toMatchObject({ status: "sent", messageId: expect.stringMatching(/^msg-/) });
    expect(store.enrollment("a")).toMatchObject({ status: "active", nextPosition: 2 });
    expect(store.sendsFor("b")[0]).toMatchObject({ status: "failed", error: expect.stringContaining("422") });
    expect(store.enrollment("b")).toMatchObject({ status: "failed", nextPosition: 1 });
  });

  it("uses a stable per-attempt idempotency key and the campaign sender", async () => {
    const { store, deps, calls } = setup();
    await runDripWorker(deps);
    expect(calls[0].idempotencyKey).toBe(`drip-${store.sendsFor("a")[0].id}`);
    expect(calls[0].from).toBe("DSSA Events <events@example.org>");
  });
});

describe("drip worker: lost responses and uncertain delivery", () => {
  const transient: ProviderFn = () => ({ kind: "transient", detail: "timeout" });

  it("retries a possibly-accepted send with the SAME idempotency key after the lease", async () => {
    const { store, deps, calls, setProvider } = setup(transient);
    await runDripWorker(deps);
    expect(store.sendsFor("a")[0]).toMatchObject({ status: "sending", attempts: 1 });
    expect(store.enrollment("a").nextPosition).toBe(1);

    // Before the lease expires nothing is retried.
    store.advance(5 * 60_000);
    setProvider(ok);
    await runDripWorker(deps);
    expect(calls).toHaveLength(2);

    store.advance(6 * 60_000);
    await runDripWorker(deps);
    expect(calls).toHaveLength(4);
    expect(calls[2].idempotencyKey).toBe(calls[0].idempotencyKey);
    expect(store.sendsFor("a")[0]).toMatchObject({ status: "sent", attempts: 2 });
    expect(store.sends).toHaveLength(2); // still one attempt row per recipient
  });

  it("records 'uncertain' after repeated failures and never resends it", async () => {
    const { store, deps, calls } = setup(transient);
    for (let i = 0; i < 3; i++) {
      await runDripWorker(deps);
      store.advance(11 * 60_000);
    }
    expect(store.sendsFor("a")[0]).toMatchObject({ status: "uncertain", attempts: 3 });
    expect(store.enrollment("a").status).toBe("held");
    const callsAtGiveUp = calls.length;

    store.advance(60 * 60_000);
    await runDripWorker(deps);
    await runDripWorker(deps);
    expect(calls).toHaveLength(callsAtGiveUp);
    expect(store.sendsFor("a")[0].status).toBe("uncertain");
  });

  it("gives up (uncertain) instead of retrying once the idempotency window has passed", async () => {
    const { store, deps, calls, setProvider } = setup(transient);
    await runDripWorker(deps);
    const before = calls.length;

    setProvider(ok);
    store.advance(21 * 3_600_000);
    await runDripWorker(deps);

    expect(store.sendsFor("a")[0].status).toBe("uncertain");
    expect(calls).toHaveLength(before);
  });

  it("recovers when the provider accepted the message but we lost our own bookkeeping", async () => {
    const { store, deps, calls } = setup();
    const realFinish = store.finish.bind(store);
    let failOnce = true;
    store.finish = async (id, outcome) => {
      if (failOnce && outcome.status === "sent") {
        failOnce = false;
        throw new Error("db connection lost");
      }
      return realFinish(id, outcome);
    };

    const summary = await runDripWorker(deps);
    expect(summary.errors.length).toBeGreaterThan(0);
    expect(store.sendsFor("a")[0].status).toBe("sending");

    store.advance(11 * 60_000);
    await runDripWorker(deps);
    // The retry reuses the key, so a real provider would return the original message.
    expect(calls).toHaveLength(3); // a, b, then a again (b was already recorded as sent)
    expect(calls[2].to).toBe("a@udel.edu");
    expect(calls[2].idempotencyKey).toBe(calls[0].idempotencyKey);
    expect(store.sendsFor("a")[0].status).toBe("sent");
  });

  it("stops the run on a provider block and releases unstarted claims without losing them", async () => {
    const { store, deps, calls, setProvider } = setup(() => ({ kind: "blocked", detail: "HTTP 401" }));
    const summary = await runDripWorker(deps);

    expect(summary.aborted).toBe("HTTP 401");
    expect(calls).toHaveLength(1);
    expect(store.sends).toHaveLength(0); // both released, nothing recorded as sent/failed
    expect(store.enrollment("a").status).toBe("active");

    setProvider(ok);
    await runDripWorker(deps);
    expect(store.sends.filter((s) => s.status === "sent")).toHaveLength(2);
  });

  it("releases (never sends) claims it runs out of time for", async () => {
    const { store, deps, calls } = setup();
    const summary = await runDripWorker(deps, { deadlineMs: -1 });
    expect(calls).toHaveLength(0);
    expect(summary.released).toBe(2);
    expect(store.sends).toHaveLength(0);
  });
});

describe("drip worker: unsubscribes", () => {
  it("an event-list unsubscribe after enrollment suppresses the remaining steps", async () => {
    const { store, deps, calls } = setup();
    await runDripWorker(deps); // step 1 goes to both
    store.contacts.get("a")!.source_metadata = { unsubscribed_lists: ["event"] };

    store.now = new Date("2026-11-10T09:00:00Z");
    await runDripWorker(deps);

    expect(calls.filter((c) => c.to === "a@udel.edu")).toHaveLength(1);
    expect(calls.filter((c) => c.to === "b@udel.edu")).toHaveLength(2);
    expect(store.enrollment("a").status).toBe("unsubscribed");
  });

  it("a global unsubscribe (status or 'all') also stops the sequence", async () => {
    const { store, deps, calls } = setup();
    await runDripWorker(deps);
    store.contacts.get("a")!.status = "unsubscribed";
    store.contacts.get("b")!.source_metadata = { unsubscribed_lists: ["all"] };

    store.now = new Date("2026-11-10T09:00:00Z");
    await runDripWorker(deps);
    expect(calls).toHaveLength(2);
    expect(store.enrollment("a").status).toBe("unsubscribed");
    expect(store.enrollment("b").status).toBe("unsubscribed");
  });

  it("an unsubscribe from a different list does not stop event emails", async () => {
    const { store, deps, calls } = setup();
    store.contacts.get("a")!.source_metadata = { unsubscribed_lists: ["newsletter"] };
    await runDripWorker(deps);
    expect(recipientsOf(calls)).toEqual(["a@udel.edu", "b@udel.edu"]);
  });

  it("an unsubscribe that lands between claim and send still wins", async () => {
    const { store, deps, calls } = setup();
    const realClaim = store.claimDue.bind(store);
    store.claimDue = async (limit) => {
      const claimed = await realClaim(limit);
      store.contacts.get("a")!.status = "unsubscribed";
      return claimed;
    };
    await runDripWorker(deps);
    expect(recipientsOf(calls)).toEqual(["b@udel.edu"]);
  });
});

describe("drip worker: pause and resume", () => {
  let ctx: ReturnType<typeof setup>;
  beforeEach(() => {
    ctx = setup();
  });

  it("a paused campaign dispatches nothing", async () => {
    ctx.store.campaign.status = "paused";
    const summary = await runDripWorker(ctx.deps);
    expect(summary.claimed).toBe(0);
    expect(ctx.calls).toHaveLength(0);
  });

  it("pausing after claim but before send releases the claim", async () => {
    const { store, deps, calls } = ctx;
    const realClaim = store.claimDue.bind(store);
    store.claimDue = async (limit) => {
      const claimed = await realClaim(limit);
      store.campaign.status = "paused";
      return claimed;
    };
    const summary = await runDripWorker(deps);
    expect(calls).toHaveLength(0);
    expect(summary.released).toBe(2);
    expect(store.sends).toHaveLength(0);
  });

  it("resume continues without resending completed steps", async () => {
    const { store, deps, calls } = ctx;
    await runDripWorker(deps); // step 1 sent to a and b

    store.campaign.status = "paused";
    store.now = new Date("2026-11-10T09:00:00Z");
    await runDripWorker(deps);
    expect(calls).toHaveLength(2);

    store.campaign.status = "active";
    await runDripWorker(deps);
    expect(calls).toHaveLength(4);
    expect(calls.slice(0, 2).every((c) => c.subject === "Step 1")).toBe(true);
    expect(calls.slice(2).every((c) => c.subject === "Step 2")).toBe(true);
    expect(new Set(calls.map((c) => c.idempotencyKey)).size).toBe(4);
  });
});

import { describe, expect, it, vi } from "vitest";
import { classifyResendResponse, createResendProvider } from "@/lib/drip-provider";

describe("classifyResendResponse", () => {
  it("treats 2xx as accepted and captures the message id", () => {
    expect(classifyResendResponse(200, JSON.stringify({ id: "abc" }))).toEqual({ kind: "ok", messageId: "abc" });
    expect(classifyResendResponse(200, "not json")).toEqual({ kind: "ok", messageId: null });
  });

  it.each([
    [401, "blocked"],
    [403, "blocked"],
    [429, "blocked"],
    [400, "rejected"],
    [422, "rejected"],
    [408, "transient"],
    [409, "transient"],
    [500, "transient"],
    [503, "transient"],
  ])("HTTP %i -> %s", (status, kind) => {
    expect(classifyResendResponse(status, "x").kind).toBe(kind);
  });
});

describe("createResendProvider", () => {
  const req = {
    idempotencyKey: "drip-1",
    from: "DSSA <a@b.org>",
    replyTo: "r@b.org",
    to: "x@udel.edu",
    subject: "S",
    text: "t",
    html: "<p>h</p>",
  };

  it("sends the idempotency key and a single recipient", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ id: "m1" }), { status: 200 }));
    const result = await createResendProvider("key", fetchMock as unknown as typeof fetch)(req);

    expect(result).toEqual({ kind: "ok", messageId: "m1" });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect((init.headers as Record<string, string>)["Idempotency-Key"]).toBe("drip-1");
    expect(JSON.parse(init.body as string).to).toEqual(["x@udel.edu"]);
  });

  it("reports network failures as transient (outcome unknown), never as failed", async () => {
    const fetchMock = vi.fn(async () => {
      throw new Error("socket hang up");
    });
    const result = await createResendProvider("key", fetchMock as unknown as typeof fetch)(req);
    expect(result).toEqual({ kind: "transient", detail: "socket hang up" });
  });
});

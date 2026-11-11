import { NextResponse } from "next/server";
import { DripServiceError } from "./drip-service";

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function readJson(request: Request): Promise<unknown | undefined> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

export function dripErrorResponse(err: unknown, context: string): NextResponse {
  if (err instanceof DripServiceError) {
    return NextResponse.json(
      { success: false, message: err.message, ...(err.details ? { details: err.details } : {}) },
      { status: err.status }
    );
  }
  const message = err instanceof Error ? err.message : "An unexpected error occurred";
  console.error(`[${context}]`, message);
  return NextResponse.json({ success: false, message: "An unexpected error occurred" }, { status: 500 });
}

import { NextResponse } from "next/server";

export const revalidate = 3600; // cache for 1 hour

export async function GET() {
  try {
    const res = await fetch("https://api.github.com/repos/bluehen-tech/ud-dssa-website", {
      headers: {
        Accept: "application/vnd.github+json",
      },
      // Next.js caching hint (works with revalidate too)
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json({ stars: null }, { status: 200 });
    }

    const data = await res.json();
    return NextResponse.json(
      { stars: typeof data?.stargazers_count === "number" ? data.stargazers_count : null },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ stars: null }, { status: 200 });
  }
}
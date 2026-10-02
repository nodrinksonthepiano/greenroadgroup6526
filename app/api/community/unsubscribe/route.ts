import { NextResponse } from "next/server";
import { communitySiteUrl } from "@/lib/community-welcome-email";
import { unsubscribeCommunity } from "@/lib/community-subscribers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

function tokenFrom(request: Request): string {
  return new URL(request.url).searchParams.get("token")?.trim() ?? "";
}

export async function GET(request: Request) {
  const token = tokenFrom(request);
  const destination = new URL("/unsubscribe", communitySiteUrl());
  if (token) destination.searchParams.set("token", token);
  return NextResponse.redirect(destination, { headers: noStore });
}

export async function POST(request: Request) {
  try {
    const result = await unsubscribeCommunity(tokenFrom(request));
    if (result === "invalid") {
      return NextResponse.json(
        { ok: false },
        { status: 400, headers: noStore },
      );
    }
    return NextResponse.json({ ok: true }, { headers: noStore });
  } catch (error) {
    console.error(
      "Community unsubscribe failed",
      error instanceof Error ? error.message : "unknown",
    );
    return NextResponse.json(
      { ok: false },
      { status: 503, headers: noStore },
    );
  }
}

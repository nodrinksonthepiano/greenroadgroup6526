import { NextResponse } from "next/server";
import {
  CommunityDeliveryError,
  CommunityInputError,
  joinCommunity,
} from "@/lib/community-subscribers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400, headers: noStore },
    );
  }

  const input =
    body && typeof body === "object" ? (body as Record<string, unknown>) : {};

  try {
    await joinCommunity({
      email: input.email,
      firstName: input.firstName,
      utm: input,
    });
    return NextResponse.json({ ok: true }, { headers: noStore });
  } catch (error) {
    if (error instanceof CommunityInputError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400, headers: noStore },
      );
    }

    console.error(
      "Community subscribe failed",
      error instanceof Error ? error.message : "unknown",
    );

    if (error instanceof CommunityDeliveryError) {
      return NextResponse.json(
        { error: error.message },
        { status: 502, headers: noStore },
      );
    }

    return NextResponse.json(
      { error: "Could not join right now. Please try again." },
      { status: 503, headers: noStore },
    );
  }
}

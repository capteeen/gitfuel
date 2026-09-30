import { NextResponse } from "next/server";
import { getClaim, getMarketByGithubId, listClaimEvents } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ githubId: string }> }) {
  const { githubId } = await context.params;
  const id = Number(githubId);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "GitHub id must be numeric." }, { status: 400 });
  const market = getMarketByGithubId(id);
  if (!market) return NextResponse.json({ error: "Market missing." }, { status: 404 });
  return NextResponse.json({ market, claim: getClaim(id), events: listClaimEvents(id) });
}

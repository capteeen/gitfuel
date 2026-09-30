import { NextResponse } from "next/server";
import { z } from "zod";
import { addClaimEvent, getClaim, getMarketByGithubId, saveClaim } from "@/lib/db";
import { githubPermission } from "@/lib/github";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  githubRepoId: z.number().int().positive(),
  wallet: z.string().min(32),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session.accessToken || !session.githubLogin || !session.githubUserId) {
    return NextResponse.json({ error: "Sign in with GitHub before the permission check." }, { status: 401 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Repo id and wallet are required." }, { status: 400 });
  const market = getMarketByGithubId(parsed.data.githubRepoId);
  if (!market) return NextResponse.json({ error: "No market for that GitHub id." }, { status: 404 });
  const existing = getClaim(market.githubRepoId);
  if (existing?.status === "active" && existing.githubUserId !== session.githubUserId) {
    return NextResponse.json(
      {
        error: "Already claimed by another verified admin. Contested claims are not adjudicated in Phase 1.",
        legal: "/legal#claims",
        claim: existing,
      },
      { status: 409 },
    );
  }
  try {
    const ownerMatch = session.githubLogin.toLowerCase() === market.owner.toLowerCase();
    const checked = await githubPermission(session.accessToken, market.owner, market.name, session.githubLogin);
    const eligible = ownerMatch || checked.permission === "admin";
    if (!eligible) {
      return NextResponse.json(
        {
          error: `Need admin on this repo. Signed in as @${session.githubLogin} with permission “${checked.permission}”.`,
          permission: checked.permission,
        },
        { status: 403 },
      );
    }
    const claim = {
      githubRepoId: market.githubRepoId,
      githubUserId: session.githubUserId,
      githubLogin: session.githubLogin,
      solanaPubkey: parsed.data.wallet,
      status: "pending" as const,
      permission: ownerMatch ? "owner" : checked.permission,
      verifiedAt: new Date().toISOString(),
    };
    saveClaim(claim);
    addClaimEvent(market.githubRepoId, "verified", `@${session.githubLogin} passed as ${claim.permission}. Wallet not bound yet.`);
    return NextResponse.json({ claim, market, eligible: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Permission check failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { addClaimEvent, getClaim, saveClaim } from "@/lib/db";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  githubRepoId: z.number().int().positive(),
  wallet: z.string().min(32),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session.githubUserId || !session.githubLogin) {
    return NextResponse.json({ error: "GitHub session missing." }, { status: 401 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Repo id and wallet are required." }, { status: 400 });
  const claim = getClaim(parsed.data.githubRepoId);
  if (!claim || claim.githubUserId !== session.githubUserId) {
    return NextResponse.json({ error: "Verify adminship before binding a wallet." }, { status: 400 });
  }
  if (claim.status === "revoked") {
    return NextResponse.json({ error: "This claim is revoked. Phase 1 does not run a dispute process." }, { status: 409 });
  }
  const next = { ...claim, solanaPubkey: parsed.data.wallet, status: "active" as const };
  saveClaim(next);
  addClaimEvent(
    claim.githubRepoId,
    "bound",
    `@${session.githubLogin} bound ${parsed.data.wallet}. Proof of control at verification time, not a legal ownership finding.`,
  );
  return NextResponse.json({
    claim: next,
    feeShare: {
      label: "Proposed, not executed by this request",
      builderBps: 7000,
      launcherBps: 1500,
      platformBps: 1500,
      interim: "Until the sharing-config admin signs an update, an unclaimed builder slice may sit with the platform treasury. That custodial interim is labeled in the launch flow.",
    },
  });
}

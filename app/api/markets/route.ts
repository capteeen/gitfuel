import { NextResponse } from "next/server";
import { z } from "zod";
import { assertConfirmedCreate } from "@/lib/confirm-tx";
import { getMarketByGithubId, insertMarket, launchRegistryBlock, listLanguages, listMarkets } from "@/lib/db";
import { resolvePublicRepo } from "@/lib/github";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const minStars = Number(searchParams.get("minStars") || "0");
  const markets = await listMarkets({
    q: searchParams.get("q") || undefined,
    language: searchParams.get("language") || undefined,
    minStars: Number.isFinite(minStars) ? minStars : 0,
    claim: searchParams.get("claim") || undefined,
    stage: searchParams.get("stage") || undefined,
  });
  return NextResponse.json({ markets, languages: await listLanguages() });
}

const bodySchema = z.object({
  githubRepoId: z.number().int().positive(),
  owner: z.string().min(1),
  repo: z.string().min(1),
  coinName: z.string().min(1).max(32),
  symbol: z.string().regex(/^[A-Z0-9]{1,10}$/),
  mint: z.string().min(32),
  metadataUri: z.string().url(),
  imageUrl: z.string().url().nullable().optional(),
  launcher: z.string().min(32),
  signature: z.string().min(32),
});

export async function POST(request: Request) {
  const blocked = await launchRegistryBlock();
  if (blocked) {
    return NextResponse.json({ error: blocked }, { status: 503 });
  }
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Launch registration is missing a field.", issues: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const repo = await resolvePublicRepo(parsed.data.owner, parsed.data.repo);
    if (repo.githubRepoId !== parsed.data.githubRepoId) {
      return NextResponse.json({ error: "GitHub id does not match a fresh lookup of that repo." }, { status: 400 });
    }
    const existing = await getMarketByGithubId(repo.githubRepoId);
    if (existing) {
      return NextResponse.json({ error: "This GitHub repo id already has a market.", market: existing }, { status: 409 });
    }
    await assertConfirmedCreate(parsed.data.signature, parsed.data.mint, parsed.data.launcher);
    const market = await insertMarket({
      repo,
      coinName: parsed.data.coinName,
      symbol: parsed.data.symbol,
      mint: parsed.data.mint,
      metadataUri: parsed.data.metadataUri,
      imageUrl: parsed.data.imageUrl ?? null,
      launcher: parsed.data.launcher,
    });
    return NextResponse.json({ market });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not register the market.";
    const status = message.includes("already has a market") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

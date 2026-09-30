import { NextResponse } from "next/server";
import { getMarketByGithubId, getRepo } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const githubRepoId = Number(id);
  if (!Number.isInteger(githubRepoId)) {
    return NextResponse.json({ error: "GitHub id must be numeric." }, { status: 400 });
  }
  const market = await getMarketByGithubId(githubRepoId);
  const repo = await getRepo(githubRepoId);
  if (!market && !repo) {
    return NextResponse.json({ error: "Repo not found / market missing." }, { status: 404 });
  }
  return NextResponse.json({ market, repo });
}

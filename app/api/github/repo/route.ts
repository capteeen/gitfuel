import { NextResponse } from "next/server";
import { getMarketByGithubId, getRepo, storageConfigured } from "@/lib/db";
import { parseGithubUrl, repoResponse, resolvePublicRepo } from "@/lib/github";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const hits = new Map<string, number[]>();

function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((time) => now - time < 10 * 60 * 1000);
  if (recent.length >= 30) return true;
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

export async function GET(request: Request) {
  if (!storageConfigured()) {
    return NextResponse.json({ error: "Market registry is temporarily unavailable." }, { status: 503 });
  }
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (id) {
    const githubRepoId = Number(id);
    if (!Number.isInteger(githubRepoId) || githubRepoId <= 0) {
      return NextResponse.json({ error: "GitHub id must be a positive integer." }, { status: 400 });
    }
    const repo = await getRepo(githubRepoId);
    if (!repo) {
      return NextResponse.json({ error: "This id is not cached. Paste the GitHub URL again." }, { status: 404 });
    }
    return NextResponse.json({ repo, market: await getMarketByGithubId(githubRepoId) });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (limited(ip)) {
    return NextResponse.json({ error: "Too many repo lookups. Wait a few minutes." }, { status: 429 });
  }
  const parsed = parseGithubUrl(searchParams.get("url") || "");
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  try {
    const repo = await resolvePublicRepo(parsed.owner, parsed.repo);
    return NextResponse.json(await repoResponse(repo));
  } catch (error) {
    const message = error instanceof Error ? error.message : "GitHub lookup failed.";
    const status = message.includes("404") || message.includes("Private") ? 404 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}

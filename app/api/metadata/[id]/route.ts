import { NextResponse } from "next/server";
import { z } from "zod";
import { getMarketByGithubId, getRepo, launchRegistryBlock, readMetadata, saveMetadata, storageConfigured } from "@/lib/db";
import { supabaseConfigured } from "@/lib/supabase";
import { resolveRepoById } from "@/lib/github";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await readMetadata(Number(id));
  if (!body) return NextResponse.json({ error: "Metadata missing." }, { status: 404 });
  return new NextResponse(body, {
    headers: { "content-type": "application/json", "cache-control": "public, max-age=60" },
  });
}

const schema = z.object({
  githubRepoId: z.number().int().positive(),
  name: z.string().min(1).max(32),
  symbol: z.string().regex(/^[A-Z0-9]{1,10}$/),
  description: z.string().max(500),
  image: z.string().url(),
  website: z.string().url(),
});

export async function POST(request: Request) {
  const blocked = await launchRegistryBlock();
  if (blocked) {
    return NextResponse.json({ error: blocked }, { status: 503 });
  }
  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Metadata is incomplete." }, { status: 400 });
  const repo = (await getRepo(parsed.data.githubRepoId)) ?? (await resolveRepoById(parsed.data.githubRepoId));
  if (!repo || repo.htmlUrl !== parsed.data.website) {
    return NextResponse.json({ error: "Website must stay the cached GitHub URL for this id." }, { status: 400 });
  }
  const existing = await getMarketByGithubId(repo.githubRepoId);
  if (existing) {
    return NextResponse.json({ error: "This GitHub repo id already has a market.", market: existing }, { status: 409 });
  }
  if (!storageConfigured() && !process.env.PINATA_JWT && !supabaseConfigured()) {
    return NextResponse.json({ error: "Metadata hosting needs PINATA_JWT or a persistent repo cache." }, { status: 503 });
  }
  const document = {
    name: parsed.data.name,
    symbol: parsed.data.symbol,
    description: parsed.data.description,
    image: parsed.data.image,
    showName: true,
    createdOn: "https://repogo.xyz",
    website: repo.htmlUrl,
    external_url: repo.htmlUrl,
    attributes: [{ trait_type: "github_repo_id", value: String(repo.githubRepoId) }],
  };
  let uri = `${process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin}/api/metadata/${repo.githubRepoId}`;
  if (process.env.PINATA_JWT) {
    const pin = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pinataContent: document,
        pinataMetadata: { name: `repogo-${repo.githubRepoId}` },
      }),
    });
    if (!pin.ok) return NextResponse.json({ error: "Pinata rejected the metadata JSON." }, { status: 502 });
    const pinned = (await pin.json()) as { IpfsHash?: string };
    if (!pinned.IpfsHash) return NextResponse.json({ error: "Pinata did not return a hash." }, { status: 502 });
    uri = `https://gateway.pinata.cloud/ipfs/${pinned.IpfsHash}`;
  }
  try {
    await saveMetadata(repo, JSON.stringify(document), uri);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not store metadata.";
    const status = message.includes("already has a market") ? 409 : 503;
    return NextResponse.json({ error: message }, { status });
  }
  return NextResponse.json({ uri, hostedLocally: !process.env.PINATA_JWT });
}

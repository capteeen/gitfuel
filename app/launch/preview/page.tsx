import { notFound, redirect } from "next/navigation";
import { LaunchPreview } from "@/components/launch-preview";
import { getMarketByGithubId, getRepo, listMarkets, storageConfigured } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function PreviewPage({ searchParams }: { searchParams: Promise<{ repo?: string }> }) {
  if (!storageConfigured()) redirect("/launch");
  const { repo: repoId } = await searchParams;
  const id = Number(repoId);
  if (!Number.isInteger(id)) notFound();
  const repo = await getRepo(id);
  if (!repo) notFound();
  const market = await getMarketByGithubId(id);
  const symbols = (await listMarkets()).map((item) => item.symbol);
  return <LaunchPreview repo={repo} market={market} symbols={symbols} />;
}

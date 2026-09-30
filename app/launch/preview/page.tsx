import { notFound } from "next/navigation";
import { LaunchPreview } from "@/components/launch-preview";
import { getMarketByGithubId, getRepo, listMarkets } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function PreviewPage({ searchParams }: { searchParams: Promise<{ repo?: string }> }) {
  const { repo: repoId } = await searchParams;
  const id = Number(repoId);
  if (!Number.isInteger(id)) notFound();
  const repo = getRepo(id);
  if (!repo) notFound();
  const market = getMarketByGithubId(id);
  const symbols = listMarkets().map((item) => item.symbol);
  return <LaunchPreview repo={repo} market={market} symbols={symbols} />;
}

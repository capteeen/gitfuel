import { notFound, redirect } from "next/navigation";
import { LaunchPreview } from "@/components/launch-preview";
import { getMarketByGithubId, getRepo, launchRegistry, listMarkets } from "@/lib/db";
import { resolveRepoById } from "@/lib/github";

export const dynamic = "force-dynamic";

export default async function PreviewPage({ searchParams }: { searchParams: Promise<{ repo?: string }> }) {
  if ((await launchRegistry()).state !== "open") redirect("/launch");
  const { repo: repoId } = await searchParams;
  const id = Number(repoId);
  if (!Number.isInteger(id)) notFound();
  const repo = (await getRepo(id)) ?? (await resolveRepoById(id));
  if (!repo) notFound();
  const market = await getMarketByGithubId(id);
  const symbols = (await listMarkets()).map((item) => item.symbol);
  return <LaunchPreview repo={repo} market={market} symbols={symbols} />;
}

import { notFound, redirect } from "next/navigation";
import { getMarketByGithubId, getRepo } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function RepoRoute({ params }: { params: Promise<{ githubId: string }> }) {
  const { githubId } = await params;
  const id = Number(githubId);
  if (!Number.isInteger(id)) notFound();
  const market = await getMarketByGithubId(id);
  if (market) redirect(`/market/${market.mint}`);
  if (await getRepo(id)) redirect(`/launch/preview?repo=${id}`);
  notFound();
}

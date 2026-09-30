import { notFound } from "next/navigation";
import { ClaimFlow } from "@/components/claim-flow";
import { getMarketByGithubId, listMarkets } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ClaimRepoPage({ params }: { params: Promise<{ githubId: string }> }) {
  const { githubId } = await params;
  const id = Number(githubId);
  if (!Number.isInteger(id) || !(await getMarketByGithubId(id))) notFound();
  return <ClaimFlow markets={await listMarkets()} initialId={id} />;
}

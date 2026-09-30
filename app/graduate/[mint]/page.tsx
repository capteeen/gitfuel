import { notFound } from "next/navigation";
import { GraduatePanel } from "@/components/graduate-panel";
import { getMarketByMint } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function GraduatePage({ params }: { params: Promise<{ mint: string }> }) {
  const { mint } = await params;
  const market = await getMarketByMint(mint);
  if (!market) notFound();
  return <GraduatePanel market={market} />;
}

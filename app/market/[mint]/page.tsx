import { notFound } from "next/navigation";
import { TradePanel } from "@/components/trade-panel";
import { getMarketByMint } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function MarketPage({ params }: { params: Promise<{ mint: string }> }) {
  const { mint } = await params;
  const market = getMarketByMint(mint);
  if (!market) notFound();
  return <TradePanel market={market} />;
}

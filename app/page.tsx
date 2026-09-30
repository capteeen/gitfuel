import { DiscoverBoard } from "@/components/discover-board";
import { Hero } from "@/components/hero";
import { listMarkets } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const markets = await listMarkets();
  return (
    <>
      <Hero markets={markets} />
      <DiscoverBoard markets={markets} />
    </>
  );
}

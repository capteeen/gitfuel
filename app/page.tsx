import { DiscoverBoard } from "@/components/discover-board";
import { Hero } from "@/components/hero";
import { listMarkets } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const markets = listMarkets();
  return (
    <>
      <Hero markets={markets} />
      <DiscoverBoard markets={markets} />
    </>
  );
}

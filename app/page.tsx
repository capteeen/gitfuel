import { DiscoverBoard } from "@/components/discover-board";
import { Hero } from "@/components/hero";
import { listDisplayedMarkets } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { markets, error } = await listDisplayedMarkets();
  return (
    <>
      <Hero markets={markets} />
      <DiscoverBoard markets={markets} loadError={error} />
    </>
  );
}

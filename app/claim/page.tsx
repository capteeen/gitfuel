import { ClaimFlow } from "@/components/claim-flow";
import { listMarkets } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function ClaimPage() {
  return <ClaimFlow markets={listMarkets()} />;
}

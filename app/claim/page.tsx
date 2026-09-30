import { ClaimFlow } from "@/components/claim-flow";
import { listMarkets, storageConfigured } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ClaimPage() {
  if (!storageConfigured()) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-[#111320] p-8">
        <h1 className="font-display text-4xl text-white">Claims are temporarily unavailable</h1>
        <p className="mt-4 text-sm leading-relaxed text-[#9DA8BE]">
          The market registry is not connected yet. Claims will reopen when persistent storage is configured.
        </p>
      </div>
    );
  }
  return <ClaimFlow markets={await listMarkets()} />;
}

import { LaunchForm } from "@/components/launch-form";
import { launchRegistry } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function LaunchPage() {
  const registry = await launchRegistry();
  if (registry.state === "missing_table") {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-[#111320] p-8">
        <h1 className="font-display text-4xl text-white">The markets table is not set up yet</h1>
        <p className="mt-4 text-sm leading-relaxed text-[#9DA8BE]">
          Supabase is configured, but public.markets does not exist. Apply supabase/migrations/20260930120000_markets.sql in the Supabase SQL editor, then refresh this page.
        </p>
      </div>
    );
  }
  if (registry.state !== "open") {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-[#111320] p-8">
        <h1 className="font-display text-4xl text-white">Launches are temporarily unavailable</h1>
        <p className="mt-4 text-sm leading-relaxed text-[#9DA8BE]">
          {registry.detail || "The market registry is not connected yet. Launches will reopen when persistent storage is configured."}
        </p>
      </div>
    );
  }
  return <LaunchForm />;
}

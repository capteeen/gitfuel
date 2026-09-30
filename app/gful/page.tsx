import { dexscreenerUrl } from "@/lib/cluster";
import { GFUL_POLICY, policyPayload } from "@/lib/policy";

export const dynamic = "force-dynamic";

export default function GfulPage() {
  const policy = policyPayload;
  return (
    <div className="mx-auto max-w-4xl">
      <p className="font-mono text-xs text-[#9CB7FF]">06 Buy back</p>
      <h1 className="mt-2 font-display text-6xl text-white">$GITFUEL</h1>
      <p className="mt-3 max-w-2xl text-[#9DA8BE]">Pre-TGE: policy only. This dashboard does not list buys, burns, or reserve balances unless a reviewed execution is linked. The list below is empty on purpose.</p>
      <section className="mt-6 rounded-3xl border border-[#9CB7FF]/40 bg-[#111320] p-5">
        <p className="text-[11px] tracking-[0.18em] text-[#9CB7FF]">PROPOSED</p>
        <h2 className="mt-2 text-2xl text-white">60 / 20 / 20</h2>
        <p className="mt-2 text-sm text-[#9DA8BE]">Of eligible platform revenue — the 15% ops slice of creator fees, plus any app fees, net of costs.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {GFUL_POLICY.map((item) => (
            <article key={item.destination} className="rounded-2xl border border-[#2B3150] p-4">
              <p className="font-mono text-2xl text-[#C9D5FF]">{item.share}</p>
              <p className="mt-1 text-white">{item.destination}</p>
              <p className="mt-2 text-xs text-[#9DA8BE]">{item.purpose}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="mt-6">
        <h2 className="text-white">Mint</h2>
        {policy.mint ? (
          <p className="mt-2 font-mono text-sm text-[#C9D5FF]">{policy.mint} · <a className="underline" href={dexscreenerUrl(policy.mint)}>DexScreener</a></p>
        ) : (
          <p className="mt-2 text-sm text-[#9DA8BE]">Not issued in this build. There is no waitlist that pretends otherwise.</p>
        )}
      </section>
      <section className="mt-6 overflow-x-auto">
        <h2 className="text-white">Transparency</h2>
        <table className="mt-3 w-full text-left text-sm">
          <thead className="text-[#9DA8BE]">
            <tr>
              <th className="py-2 font-normal">Period</th>
              <th className="font-normal">Inflow</th>
              <th className="font-normal">Allocated</th>
              <th className="font-normal">Status</th>
            </tr>
          </thead>
          <tbody>
            {policy.executions.length === 0 ? (
              <tr className="border-t border-[#2B3150]">
                <td className="py-3">—</td>
                <td>Not reported</td>
                <td>—</td>
                <td className="text-[#9CB7FF]">proposed</td>
              </tr>
            ) : (
              policy.executions.map((row) => (
                <tr key={row.period}>
                  <td>{row.period}</td>
                  <td>{row.inflow}</td>
                  <td>{row.allocated}</td>
                  <td>{row.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
      <p className="mt-6 text-sm text-[#9DA8BE]">Revenue sources, when a policy is live: the platform 15% slice and any app fees. <a className="text-white underline" href="/docs#fees">Fee sketch</a>.</p>
    </div>
  );
}

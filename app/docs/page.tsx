import { CREATOR_FEE_SPLIT, GFUL_POLICY } from "@/lib/policy";

const LOOP = [
  ["01", "Discover", "Browse markets tied to public repos, or paste a URL to resolve one."],
  ["02", "Launch", "Prefill coin metadata from GitHub and create on the pump.fun bonding curve."],
  ["03", "Trade", "Buy and sell on the curve before graduation. Afterward, the pair is PumpSwap."],
  ["04", "Builders earn", "A verified owner or admin claims creator fees. This is the highlighted step."],
  ["05", "Graduate", "A complete curve can be migrated, permissionlessly, to PumpSwap."],
  ["06", "Buy back", "Platform revenue policy for $GITFUEL. Proposed until a real transaction is linked."],
];

export default function DocsPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-8">
      <header>
        <p className="font-mono text-xs text-[#9CB7FF]">Docs</p>
        <h1 className="mt-2 font-display text-5xl text-white">The loop</h1>
        <p className="mt-3 text-[#9DA8BE]">GitFuel is an open-source markets layer on Solana. Paste a public GitHub URL, launch on pump.fun, and route creator fees to a verified owner or admin.</p>
      </header>
      <ol className="space-y-3">
        {LOOP.map(([n, title, copy]) => (
          <li key={n} id={title === "Graduate" ? "graduate" : title === "Trade" ? "trade" : undefined} className={`rounded-2xl border px-4 py-3 ${n === "04" ? "border-[#9CB7FF] shadow-[0_0_24px_rgba(163,248,107,0.15)]" : "border-[#2B3150]"}`}>
            <p className="font-mono text-xs text-[#C9D5FF]">{n} {title}</p>
            <p className="mt-1 text-sm text-[#9DA8BE]">{copy}</p>
          </li>
        ))}
      </ol>
      <section id="fees">
        <h2 className="text-2xl text-white">Fee sketch · proposed, not live</h2>
        <p className="mt-2 text-sm text-[#9DA8BE]">Per-repo creator fees, after pump takes its own cut:</p>
        <ul className="mt-3 space-y-2 text-sm">
          {CREATOR_FEE_SPLIT.map((item) => (
            <li key={item.bucket} className="flex justify-between gap-4 border-b border-[#2B3150] py-2">
              <span>{item.bucket}</span>
              <span className="font-mono text-[#C9D5FF]">{item.share}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-[#9DA8BE]">The platform slice, if and when it is collected:</p>
        <ul className="mt-3 space-y-2 text-sm">
          {GFUL_POLICY.map((item) => (
            <li key={item.destination} className="flex justify-between gap-4 border-b border-[#2B3150] py-2">
              <span>{item.destination}</span>
              <span className="font-mono text-[#C9D5FF]">{item.share}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-[#9DA8BE]">Until claim, the builder share can sit on the platform treasury while the launcher remains sharing-config admin. That is the custodial interim in the stack notes, and the trade page says so. Eligibility is GitHub owner or admin, not write or maintain alone. The identity of a market is the GitHub numeric repository id.</p>
      </section>
      <section id="community">
        <h2 className="text-2xl text-white">Links</h2>
        <p className="mt-2 text-sm text-[#9DA8BE]">GitHub, Discord, and X for GitFuel are placeholders until those accounts exist. Program notes: pump-public-docs. Ticker checks: DexScreener.</p>
      </section>
    </article>
  );
}

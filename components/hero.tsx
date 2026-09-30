import Link from "next/link";
import type { Market } from "@/lib/types";
import { Mark } from "./logo";
import { Orbital } from "./orbital";

export function Hero({ markets }: { markets: Market[] }) {
  const avatars = markets.slice(0, 3);

  return (
    <section className="hero-dusk relative min-h-[820px] px-5 pt-2 pb-10 md:px-10">
      <div className="grid items-center gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="rise mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/25 px-3 py-1 text-[10px] font-medium tracking-[0.18em] text-white/80">
            <span className="h-1.5 w-1.5 rounded-full bg-[#39FF14]" />
            OPEN-SOURCE MARKETS · PUMP.FUN
          </p>
          <h1 className="display rise rise-2">
            <span className="block">Open</span>
            <span className="flex items-center gap-[0.18em]">
              <span className="spark-pill">
                <Mark className="h-[0.42em] w-[0.42em]" />
              </span>
              source
            </span>
            <span className="block">markets</span>
          </h1>
          <p className="rise rise-3 mt-5 max-w-md text-lg text-white/80">Builders earn. Paste a repo. Launch on pump.fun. Fuel the maintainers.</p>
          <div className="rise rise-4 mt-6 flex items-center gap-3">
            <span className="font-mono text-sm text-white">
              {markets.length}
              <span className="ml-2 text-white/60">markets</span>
            </span>
            <span className="flex -space-x-2">
              {avatars.length === 0 &&
                [0, 1, 2].map((item) => <span key={item} className="h-7 w-7 rounded-full border border-white/20 bg-white/10" />)}
              {avatars.map((market) => (
                // Real GitHub avatars only. Empty rings when no market exists.
                // eslint-disable-next-line @next/next/no-img-element
                <img key={market.mint} src={market.avatarUrl} alt="" className="h-7 w-7 rounded-full border border-black/40" />
              ))}
            </span>
            <Link href="/launch" className="rounded-full bg-[#39FF14] px-4 py-2 text-sm font-semibold text-[#071208] shadow-[0_0_24px_rgba(57,255,20,0.35)]">
              Paste a GitHub URL
            </Link>
          </div>
        </div>
        <Orbital />
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
        <article className="glass-dark p-5 text-white">
          <p className="max-w-sm text-2xl leading-tight tracking-tight">Paste a repo. Fuel the maintainers.</p>
          <div className="mt-6 flex items-center justify-between">
            <p className="max-w-[14rem] text-sm text-white/60">Graduates to PumpSwap. GitFuel does not launch on Meteora.</p>
            <span className="rounded-full bg-[#39FF14] px-3 py-1 text-xs font-semibold text-[#071208]">70% admin</span>
          </div>
        </article>
        <article className="glass-dark flex items-end justify-between p-5 text-white">
          <div>
            <p className="font-display text-6xl leading-none tracking-tight">70%</p>
            <p className="mt-2 text-sm text-white/70">Proposed to verified admins</p>
          </div>
          <span className="rounded-full border border-white/15 px-3 py-1 text-[10px] tracking-[0.16em] text-[#B2FFC8]">PROPOSED</span>
        </article>
      </div>
    </section>
  );
}

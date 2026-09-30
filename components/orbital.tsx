import { ArrowUpRight, Code2, GitBranch } from "lucide-react";
import Link from "next/link";
import { Mark } from "./logo";

export function Orbital() {
  return (
    <div
      className="fuel-visual"
      aria-label="Open-source code powering a GitFuel market"
    >
      <div className="orbital-grid" aria-hidden="true" />
      <div className="orbit orbit-one" aria-hidden="true">
        <span />
      </div>
      <div className="orbit orbit-two" aria-hidden="true">
        <span />
      </div>
      <div className="orbit orbit-three" aria-hidden="true" />
      <div className="fuel-core" aria-hidden="true">
        <div className="fuel-core-inner">
          <Mark className="h-20 w-20" />
        </div>
      </div>
      <div className="orbit-label orbit-label-top">
        <span className="status-dot" /> THE OPEN-SOURCE ENGINE
      </div>
      <div className="repo-chip">
        <div className="flex items-center gap-2 text-white/80">
          <Code2 size={15} aria-hidden="true" />
          <span>your next big idea</span>
          <GitBranch
            size={13}
            className="ml-auto text-ff-muted"
            aria-hidden="true"
          />
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#e2ad78]" />
          <span className="font-mono text-[10px] text-white/45">
            git commit -m &quot;keep building&quot;
          </span>
        </div>
      </div>
      <Link href="/claim" className="builder-chip">
        <div className="flex items-center justify-between gap-6">
          <span className="text-[10px] font-medium tracking-widest">
            BACK TO BUILDERS
          </span>
          <ArrowUpRight size={17} aria-hidden="true" />
        </div>
        <p className="mt-3 font-display text-6xl leading-none">
          70<span className="text-3xl">%</span>
        </p>
        <p className="mt-2 text-[10px] text-black/55">
          Proposed creator fee share
        </p>
      </Link>
      <div className="orbit-label orbit-label-bottom">
        <span>CODE</span>
        <span className="h-px w-10 bg-white/20" />
        <span>COMMUNITY</span>
        <span className="h-px w-10 bg-white/20" />
        <span>FUEL</span>
      </div>
    </div>
  );
}

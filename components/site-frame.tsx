"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ConnectButton } from "./connect-button";
import { Logo } from "./logo";
import { LoopStepper } from "./loop-stepper";
import { useCluster } from "./providers";

const NAV = [
  { href: "/", label: "Discover" },
  { href: "/launch", label: "Launch" },
  { href: "/claim", label: "Claim" },
  { href: "/gful", label: "$GFUL" },
];

export function SiteFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hero = pathname === "/";
  const { cluster } = useCluster();

  return (
    <div className="stage min-h-screen px-3 py-4 md:px-8 md:py-7">
      <div className="device mx-auto max-w-[1240px]">
        <div className="screen">
          <header className="flex items-center justify-between gap-3 px-4 py-4 md:px-8">
            <Logo />
            <nav className="nav-pill hidden items-center gap-1 p-1 md:flex">
              {NAV.map((item) => {
                const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "rounded-full px-4 py-1.5 text-sm",
                      active ? "bg-white font-medium text-[#14120f]" : "text-white/80",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <ConnectButton />
          </header>
          <nav className="nav-pill mx-4 mb-3 flex gap-1 overflow-x-auto p-1 md:hidden">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-full px-3 py-1 text-sm text-white/85">
                {item.label}
              </Link>
            ))}
          </nav>
          <LoopStepper />
          {cluster === "devnet" && (
            <p className="mx-4 mb-2 rounded-full border border-[#39FF14]/20 bg-black/30 px-4 py-1.5 text-center text-[11px] text-[#B2FFC8] md:mx-8">
              Browser cluster is devnet. pump.fun publishes program {`6EF8…F6P`} for mainnet. Switch the MAIN pill before a real launch. No buys are invented here.
            </p>
          )}
          <div className={hero ? "" : "px-4 py-6 md:px-10 md:py-8"}>{children}</div>
          <footer className="mt-8 border-t border-white/10 px-4 py-6 text-xs leading-relaxed text-[#7A9A88] md:px-8">
            <p>
              GitFuel is experimental software. Tokens can lose all value. Not affiliated with GitHub or pump.fun. No investment advice. Creator fee claims require GitHub admin verification and are not guarantees of payment. Revenue and buyback figures are proposed policies unless linked to verified on-chain transactions.
            </p>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-[#E8F5E9]">
              <Link href="/docs">Docs</Link>
              <Link href="/legal">Legal</Link>
              <Link href="/portfolio">Portfolio</Link>
              <span title="Placeholder until a GitFuel GitHub org is published">GitHub</span>
              <span title="Placeholder">Discord</span>
              <span title="Placeholder">X</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ConnectButton } from "./connect-button";
import { Logo } from "./logo";
import { LoopStepper } from "./loop-stepper";

const NAV = [
  { href: "/", label: "Discover" },
  { href: "/launch", label: "Launch" },
  { href: "/claim", label: "For builders" },
  { href: "/gful", label: "$GFUL" },
];

export function SiteFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const home = pathname === "/";

  return (
    <div className="stage min-h-screen">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <div className="device mx-auto max-w-[1320px]">
        <div className="screen">
          <header className="site-header">
            <Logo />
            <nav aria-label="Main navigation" className="main-nav">
              {NAV.map((item) => {
                const active =
                  item.href === "/" ? home : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn("nav-link", active && "is-active")}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <ConnectButton />
          </header>
          {!home && <LoopStepper />}
          <main
            id="main-content"
            tabIndex={-1}
            className={home ? "" : "inner-page"}
          >
            {children}
          </main>
          <footer className="site-footer">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div>
                <Logo />
                <p className="mt-2 text-xs text-ff-muted">
                  A little fuel. A lot of possibility.
                </p>
              </div>
              <nav
                aria-label="Footer"
                className="flex gap-6 text-sm text-white/70"
              >
                <Link href="/docs">Docs</Link>
                <Link href="/portfolio">Portfolio</Link>
                <Link href="/legal">Legal</Link>
              </nav>
            </div>
            <p className="mt-7 max-w-4xl text-[11px] leading-relaxed text-ff-muted">
              GitFuel is experimental software. Tokens can lose all value. Not
              affiliated with GitHub or pump.fun. No investment advice. Creator
              fee claims require GitHub admin verification and are not
              guarantees of payment. Revenue and buyback figures are proposed
              policies unless linked to verified on-chain transactions.
            </p>
            <div className="mt-5 flex justify-between font-mono text-[10px] tracking-wider text-ff-muted">
              <span>BUILT FOR OPEN SOURCE</span>
              <span>POWERED BY SOLANA</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

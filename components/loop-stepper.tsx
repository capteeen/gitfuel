"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "discover", n: "01", label: "Discover", href: "/" },
  { id: "launch", n: "02", label: "Launch", href: "/launch" },
  { id: "trade", n: "03", label: "Trade", href: "/#markets" },
  { id: "earn", n: "04", label: "Builders earn", href: "/claim" },
  { id: "graduate", n: "05", label: "Graduate", href: "/docs#graduate" },
  { id: "buyback", n: "06", label: "Buy back", href: "/gful" },
];

function currentStep(pathname: string) {
  if (pathname.startsWith("/launch")) return "launch";
  if (pathname.startsWith("/market") || pathname.startsWith("/r/")) return "trade";
  if (pathname.startsWith("/claim")) return "earn";
  if (pathname.startsWith("/graduate")) return "graduate";
  if (pathname.startsWith("/gful")) return "buyback";
  if (pathname === "/" || pathname.startsWith("/discover")) return "discover";
  return null;
}

export function LoopStepper() {
  const pathname = usePathname();
  const current = currentStep(pathname);

  return (
    <div className="mx-4 mb-2 flex items-center gap-1 overflow-x-auto rounded-full border border-white/10 bg-black/35 px-2 py-1.5 md:mx-8">
      {STEPS.map((step, index) => {
        const active = current === step.id;
        const earn = step.id === "earn";
        return (
          <div key={step.id} className="flex items-center">
            <Link
              href={step.href}
              className={cn(
                "rounded-full px-2.5 py-1 text-[12px] whitespace-nowrap",
                earn && "step-earn bg-[#39FF14]/10",
                active && "bg-white text-[#14120f]",
                !active && "text-white/75",
              )}
            >
              <span className="mr-1 font-mono text-[10px] tabular-nums">{step.n}</span>
              {step.label}
            </Link>
            {index < STEPS.length - 1 && <span className="px-1 text-white/25">→</span>}
          </div>
        );
      })}
    </div>
  );
}

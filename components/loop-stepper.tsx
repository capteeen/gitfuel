"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight } from "lucide-react";
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
  if (pathname.startsWith("/market") || pathname.startsWith("/r/"))
    return "trade";
  if (pathname.startsWith("/claim")) return "earn";
  if (pathname.startsWith("/graduate")) return "graduate";
  if (pathname.startsWith("/gful")) return "buyback";
  if (pathname === "/" || pathname.startsWith("/discover")) return "discover";
  return null;
}

export function LoopStepper() {
  const current = currentStep(usePathname());
  return (
    <nav aria-label="Market lifecycle" className="loop-stepper">
      {STEPS.map((step, index) => (
        <div key={step.id} className="flex items-center gap-3">
          <Link
            href={step.href}
            aria-current={current === step.id ? "step" : undefined}
            className={cn(
              "loop-step",
              current === step.id && "is-active",
              step.id === "earn" && "builder-step",
            )}
          >
            <span>{step.n}</span>
            {step.label}
          </Link>
          {index < STEPS.length - 1 && (
            <ArrowRight className="step-arrow" size={12} aria-hidden="true" />
          )}
        </div>
      ))}
    </nav>
  );
}

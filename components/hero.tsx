import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight, GitBranch, Search, Sparkles } from "lucide-react";
import type { Market } from "@/lib/types";

type StoryCard = {
  step: string;
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  href: string;
  action: string;
  tone: "cyan" | "lilac" | "blue";
};

const cards: StoryCard[] = [
  {
    step: "01",
    eyebrow: "FIND YOUR NEXT PROJECT",
    title: "Discover repos",
    description:
      "Explore markets tied to public GitHub repositories. The code is where every story starts.",
    image: "/illustrations/discover-repos.png",
    href: "#markets",
    action: "Explore markets",
    tone: "cyan",
  },
  {
    step: "02",
    eyebrow: "BRING IT TO LIFE",
    title: "Launch a market",
    description:
      "Paste a repo, shape its token, and launch on the pump.fun bonding curve.",
    image: "/illustrations/launch-market.png",
    href: "/launch",
    action: "Launch a repo",
    tone: "lilac",
  },
  {
    step: "03",
    eyebrow: "FOR THE PEOPLE BUILDING IT",
    title: "Builders earn",
    description:
      "Verified GitHub admins can claim a proposed share of creator fees.",
    image: "/illustrations/builder-fees.png",
    href: "/claim",
    action: "How claims work",
    tone: "blue",
  },
];

export function Hero({ markets }: { markets: Market[] }) {
  return (
    <>
    <section className="hero-feature" aria-labelledby="hero-title">
      <div className="hero-feature-lines" aria-hidden="true" />
      <div className="hero-feature-copy">
        <p className="hero-feature-kicker"><Sparkles size={12} aria-hidden="true" /> OPEN SOURCE, ON SOLANA</p>
        <h1 id="hero-title">Give code the <span>momentum</span> it deserves.</h1>
        <p className="hero-feature-description">
          Discover markets for the repositories you believe in. Launch one for a project you love. Give builders a stake in what comes next.
        </p>
        <div className="hero-feature-actions">
          <Link href="#markets" className="hero-feature-primary">Explore markets <ArrowRight size={17} aria-hidden="true" /></Link>
          <Link href="/launch" className="hero-feature-secondary">Launch a repo <ArrowUpRight size={17} aria-hidden="true" /></Link>
          <a className="hero-feature-x" href="https://x.com/gitfuel/status/2105418284426580144" target="_blank" rel="noopener noreferrer">
            <XMark /> On X
          </a>
        </div>
      </div>
      <div className="hero-browser" aria-label="Preview of finding and launching a repository market">
        <div className="hero-browser-bar">
          <div className="hero-browser-dots" aria-hidden="true"><i /><i /><i /></div>
          <span>gitfuel.app / discover</span>
          <span className="hero-browser-status"><span /> BUILT ON SOLANA</span>
        </div>
        <div className="hero-browser-body">
          <div className="hero-browser-intro">
            <div>
              <p>THE NEXT WAVE STARTS HERE</p>
              <h2>Find the code worth fueling.</h2>
            </div>
            <div className="hero-browser-orbit" aria-hidden="true"><Image src="/illustrations/launch-market.png" alt="" fill sizes="220px" className="object-contain" /></div>
          </div>
          <div className="hero-browser-search"><Search size={18} aria-hidden="true" /><span>Search repositories, symbols, or builders</span><kbd>⌘ K</kbd></div>
          <div className="hero-browser-row">
            <div className="hero-browser-repo"><GitBranch size={18} aria-hidden="true" /><span>your-org / your-next-idea</span></div>
            <span className="hero-browser-pill">YOUR NEXT MARKET</span>
            <span className="hero-browser-row-action">Launch a repo <ArrowUpRight size={15} aria-hidden="true" /></span>
          </div>
        </div>
      </div>
    </section>
    <section className="hero-showcase" aria-labelledby="journey-title">
      <div className="showcase-intro">
        <div>
          <p className="showcase-kicker">
            <span /> GITFUEL / OPEN-SOURCE MARKETS
          </p>
          <h2 id="journey-title">
            Code deserves <em>momentum.</em>
          </h2>
        </div>
        <div className="showcase-aside">
          <p>
            A new way to back the repositories you believe in and the builders
            behind them.
          </p>
          <Link href="#markets">
            Explore {markets.length}{" "}
            {markets.length === 1 ? "market" : "markets"}{" "}
            <ArrowDown size={15} aria-hidden="true" />
          </Link>
        </div>
      </div>

      <div className="journey-grid">
        {cards.map((card, index) => (
          <article
            key={card.step}
            className={`journey-card journey-${card.tone}`}
          >
            <div className="journey-topline">
              <span>{card.step} / 03</span>
              <span>GITFUEL</span>
            </div>
            <div className="journey-art">
              <Image
                src={card.image}
                alt=""
                fill
                sizes="(max-width: 760px) 88vw, (max-width: 1320px) 30vw, 370px"
                priority={index === 0}
                className="object-contain"
              />
            </div>
            <div className="journey-content">
              <p className="journey-eyebrow">{card.eyebrow}</p>
              <h2>{card.title}</h2>
              <p className="journey-description">{card.description}</p>
              {card.step === "03" && (
                <p className="journey-policy">
                  70% VERIFIED ADMIN SHARE <span>PROPOSED</span>
                </p>
              )}
              <Link href={card.href} className="journey-action">
                {card.action} <ArrowUpRight size={17} aria-hidden="true" />
              </Link>
            </div>
          </article>
        ))}
      </div>
      <div className="showcase-foot">
        <span>ONE REPO. ONE MARKET.</span>
        <span>DISCOVER → LAUNCH → BUILDERS EARN</span>
        <span>ON SOLANA</span>
      </div>
    </section>
    </>
  );
}

function XMark() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

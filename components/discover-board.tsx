"use client";

import { useMemo, useState } from "react";
import type { Market } from "@/lib/types";
import { formatStars, shortKey } from "@/lib/format";

export function DiscoverBoard({ markets }: { markets: Market[] }) {
  const [q, setQ] = useState("");
  const [language, setLanguage] = useState("");
  const [minStars, setMinStars] = useState("0");
  const [claim, setClaim] = useState("");
  const [stage, setStage] = useState("");
  const languages = useMemo(
    () => [...new Set(markets.map((market) => market.language).filter(Boolean))] as string[],
    [markets],
  );
  const visible = markets.filter((market) => {
    const query = q.trim().toLowerCase();
    if (query) {
      const hay = `${market.fullName} ${market.symbol} ${market.mint} ${market.githubRepoId}`.toLowerCase();
      if (!hay.includes(query)) return false;
    }
    if (language && market.language !== language) return false;
    if (Number(minStars) && market.stars < Number(minStars)) return false;
    if (claim === "claimed" && market.claimStatus !== "active") return false;
    if (claim === "unclaimed" && market.claimStatus === "active") return false;
    if (stage === "bonding" && market.bondingComplete) return false;
    if (stage === "graduated" && !market.bondingComplete) return false;
    return true;
  });

  return (
    <section id="markets" className="bg-[#070A0C] px-5 py-10 md:px-10">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-xs text-[#39FF14]">01 Discover</p>
          <h2 className="text-3xl tracking-tight text-white">Repo markets</h2>
        </div>
        <p className="max-w-sm text-sm text-[#7A9A88]">One market per GitHub numeric id. Rename the repo; the market stays.</p>
      </div>
      <div className="mb-5 grid gap-2 md:grid-cols-5">
        <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Repo, owner, mint, GitHub id" className="rounded-full border border-[#1C2A22] bg-[#0C1210] px-4 py-2 text-sm outline-none md:col-span-2" />
        <select value={language} onChange={(event) => setLanguage(event.target.value)} className="rounded-full border border-[#1C2A22] bg-[#0C1210] px-4 py-2 text-sm">
          <option value="">Language</option>
          {languages.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select value={minStars} onChange={(event) => setMinStars(event.target.value)} className="rounded-full border border-[#1C2A22] bg-[#0C1210] px-4 py-2 text-sm">
          <option value="0">Any stars</option>
          <option value="10">10+ stars</option>
          <option value="100">100+ stars</option>
          <option value="1000">1k+ stars</option>
        </select>
        <select value={`${claim}|${stage}`} onChange={(event) => {
          const [nextClaim, nextStage] = event.target.value.split("|");
          setClaim(nextClaim);
          setStage(nextStage);
        }} className="rounded-full border border-[#1C2A22] bg-[#0C1210] px-4 py-2 text-sm">
          <option value="|">All markets</option>
          <option value="unclaimed|">Unclaimed builder</option>
          <option value="claimed|">Claimed builder</option>
          <option value="|bonding">Bonding</option>
          <option value="|graduated">Graduated</option>
        </select>
      </div>
      {markets.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#1C2A22] p-10 text-center">
          <p className="text-lg text-white">No markets yet.</p>
          <p className="mt-2 text-sm text-[#7A9A88]">Paste a public GitHub URL and launch the first coin. Volume is not invented.</p>
          <a href="/launch" className="mt-5 inline-flex rounded-full bg-[#39FF14] px-4 py-2 text-sm font-semibold text-[#071208]">Paste a GitHub URL</a>
        </div>
      ) : visible.length === 0 ? (
        <p className="text-sm text-[#7A9A88]">No markets match those filters.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {visible.map((market) => (
            <a key={market.mint} href={`/market/${market.mint}`} className="rounded-3xl border border-[#1C2A22] bg-[#0C1210] p-4 transition duration-150 hover:-translate-y-0.5 hover:border-[#39FF14]/40">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={market.avatarUrl} alt="" className="h-10 w-10 rounded-full" />
                <div>
                  <p className="font-medium text-white">{market.fullName}</p>
                  <p className="font-mono text-xs text-[#B2FFC8]">${market.symbol} · {shortKey(market.mint)}</p>
                </div>
                <span className="ml-auto rounded-full border border-[#1C2A22] px-2 py-1 text-[10px] tracking-wide text-[#7A9A88]">
                  {market.bondingComplete ? "Graduated" : market.claimStatus === "active" ? "Claimed builder" : "Unclaimed"}
                </span>
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-[#7A9A88]">{market.description || "No description on GitHub."}</p>
              <p className="mt-3 font-mono text-xs text-[#7A9A88]">
                {formatStars(market.stars)} stars · {market.language || "—"} · id {market.githubRepoId}
              </p>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}

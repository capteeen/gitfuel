"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import type { Market } from "@/lib/types";
import { shortKey } from "@/lib/format";

export default function PortfolioPage() {
  const { publicKey } = useWallet();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/markets")
      .then((response) => response.json())
      .then((body) => setMarkets(body.markets || []))
      .catch(() => setError("Could not load markets."));
  }, []);

  const wallet = publicKey?.toBase58();
  const mine = wallet
    ? markets.filter((market) => market.launcher === wallet || market.claimedWallet === wallet)
    : [];

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-5xl text-white">Portfolio</h1>
      <p className="mt-3 text-sm text-[#7A9A88]">Launchers and claimed builders for the connected wallet. No priced positions, because this build does not index fills.</p>
      {!wallet && <p className="mt-6 text-white">Connect a wallet to see markets you launched or claimed.</p>}
      {error && <p className="mt-4 text-sm text-[#FFB4BA]">{error}</p>}
      {wallet && mine.length === 0 && <p className="mt-6 text-[#7A9A88]">No registered markets for {shortKey(wallet)}.</p>}
      <ul className="mt-6 space-y-3">
        {mine.map((market) => (
          <li key={market.mint} className="rounded-2xl border border-[#1C2A22] p-4">
            <a className="text-white" href={`/market/${market.mint}`}>{market.fullName}</a>
            <p className="mt-1 font-mono text-xs text-[#B2FFC8]">{market.symbol} · {shortKey(market.mint)} · {market.launcher === wallet ? "launcher" : "claimed builder"}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

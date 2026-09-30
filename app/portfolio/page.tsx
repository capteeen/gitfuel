"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { ArrowUpRight, GitBranch, LoaderCircle, Wallet } from "lucide-react";
import type { Market } from "@/lib/types";
import { shortKey } from "@/lib/format";

export default function PortfolioPage() {
  const { publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    fetch("/api/markets")
      .then(async (response) => {
        if (!response.ok)
          throw new Error("Could not load markets. Please try again.");
        return response.json();
      })
      .then((body) => {
        if (!cancelled) setMarkets(body.markets || []);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load markets. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const wallet = publicKey?.toBase58();
  const mine = wallet
    ? markets.filter(
        (market) =>
          market.launcher === wallet || market.claimedWallet === wallet,
      )
    : [];

  return (
    <div className="mx-auto max-w-3xl">
      <p className="eyebrow">YOUR CORNER OF OPEN SOURCE</p>
      <h1 className="mt-4 font-display text-6xl text-[#F1F2FF]">
        Your portfolio.
      </h1>
      <p className="mt-4 max-w-lg text-sm leading-relaxed text-ff-muted">
        The projects you’ve launched and the repos you’ve claimed, all in one
        place.
      </p>
      {!wallet ? (
        <div className="empty-state mt-8">
          <span className="empty-icon">
            <Wallet size={23} aria-hidden="true" />
          </span>
          <h2 className="text-lg text-white">Your projects are waiting.</h2>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-ff-muted">
            Connect your Solana wallet to see the markets you’ve launched or
            claimed.
          </p>
          <button
            className="button-primary mt-6"
            type="button"
            onClick={() => setVisible(true)}
          >
            <Wallet size={15} aria-hidden="true" />
            Connect wallet
          </button>
        </div>
      ) : loading ? (
        <p
          role="status"
          className="mt-8 flex items-center gap-2 text-sm text-ff-muted"
        >
          <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
          Loading your markets…
        </p>
      ) : error ? (
        <div role="alert" className="empty-state mt-8">
          <p className="text-sm text-red-200">{error}</p>
          <button
            className="button-secondary mt-4"
            type="button"
            onClick={() => setAttempt((value) => value + 1)}
          >
            Try again
          </button>
        </div>
      ) : mine.length === 0 ? (
        <div className="empty-state mt-8">
          <span className="empty-icon">
            <GitBranch size={23} aria-hidden="true" />
          </span>
          <h2 className="text-lg text-white">
            Your first project starts here.
          </h2>
          <p className="mt-2 text-sm text-ff-muted">
            No markets found for {shortKey(wallet)}.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/launch" className="button-primary">
              Launch a repo
              <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
            <Link href="/claim" className="button-secondary">
              Claim a repo
            </Link>
          </div>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {mine.map((market) => (
            <li key={market.mint}>
              <Link className="market-card" href={`/market/${market.mint}`}>
                <div className="flex items-center justify-between gap-4">
                  <h2 className="break-all text-sm text-white">
                    {market.fullName}
                  </h2>
                  <ArrowUpRight
                    size={16}
                    className="shrink-0 text-ff-mint"
                    aria-hidden="true"
                  />
                </div>
                <p className="font-mono text-xs text-ff-mint">
                  ${market.symbol} · {shortKey(market.mint)} ·{" "}
                  {market.launcher === wallet ? "Launcher" : "Verified builder"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-5 text-xs leading-relaxed text-ff-muted">
        This view shows market ownership. Token balances and position values
        aren’t available yet.
      </p>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import type { Market } from "@/lib/types";
import { dexscreenerUrl, platformTreasury, pumpCoinUrl, solscanMint } from "@/lib/cluster";
import { explainChainError } from "@/lib/rpc-error";
import { formatStars, shortKey } from "@/lib/format";

type CurveView = {
  complete: boolean;
  progress: number;
  creator: string;
  realQuoteSol: number;
  marketCapSol: number;
  pool: string | null;
};

export function TradePanel({ market }: { market: Market }) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { setVisible } = useWalletModal();
  const [tab, setTab] = useState<"about" | "holders" | "txns" | "builder">("about");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [slippage, setSlippage] = useState(1);
  const [curve, setCurve] = useState<CurveView | null>(null);
  const [curveError, setCurveError] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const { readCurve } = await import("@/lib/chain");
        const next = await readCurve(connection, market.mint);
        if (cancel) return;
        if (!next) {
          setCurveError("No bonding curve account on this cluster for the registered mint.");
          return;
        }
        setCurve(next);
        await fetch("/api/markets/sync", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ mint: market.mint }),
        });
      } catch (cause) {
        if (!cancel) setCurveError(explainChainError(cause, "Curve unread."));
      }
    })();
    return () => {
      cancel = true;
    };
  }, [connection, market.mint]);

  async function trade() {
    if (!wallet.publicKey || !wallet.signTransaction) {
      setVisible(true);
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const chain = await import("@/lib/chain");
      const signature = side === "buy"
        ? await chain.buyOnCurve(connection, { publicKey: wallet.publicKey, signTransaction: wallet.signTransaction }, market.mint, Number(amount), slippage)
        : await chain.sellOnCurve(connection, { publicKey: wallet.publicKey, signTransaction: wallet.signTransaction }, market.mint, amount, slippage);
      setMessage(signature);
    } catch (cause) {
      setError(explainChainError(cause, "Trade failed."));
    } finally {
      setBusy(false);
    }
  }

  async function configureFees() {
    if (!wallet.publicKey || !wallet.signTransaction) return setVisible(true);
    if (!platformTreasury) {
      setError("Set NEXT_PUBLIC_PLATFORM_TREASURY before configuring shares.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { configureCustodialShares } = await import("@/lib/chain");
      const signature = await configureCustodialShares(connection, { publicKey: wallet.publicKey, signTransaction: wallet.signTransaction }, market.mint, platformTreasury);
      setMessage(signature);
    } catch (cause) {
      setError(explainChainError(cause, "Fee share update failed."));
    } finally {
      setBusy(false);
    }
  }

  const graduated = curve?.complete || market.bondingComplete;
  const progress = Math.round((curve?.progress || (graduated ? 1 : 0)) * 100);
  const claimLabel = market.claimStatus === "pending" ? "Continue claim" : market.claimStatus === "revoked" ? "Claim again" : "Claim as owner";
  const claimCopy = market.claimStatus === "pending"
    ? "GitHub verification is in progress. Continue to bind the wallet that should receive builder fees."
    : market.claimStatus === "revoked"
      ? "The previous claim was revoked. If you own or administer this repository, verify with GitHub and try again."
      : "If you own or administer this repository, verify with GitHub and link the wallet that should receive builder fees.";

  return (
    <div>
      {market.claimStatus !== "active" && (
        <section className="coin-claim" aria-label="Claim this coin">
          <div>
            <p className="eyebrow">REPO OWNER</p>
            <h2>Claim ${market.symbol}</h2>
            <p>{claimCopy}</p>
          </div>
          <Link href={`/claim/${market.githubRepoId}`} className="button-primary">
            {claimLabel} <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </section>
      )}
    <div className="grid gap-5 lg:grid-cols-[220px_1fr_300px]">
      <aside>
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={market.avatarUrl} alt="" className="h-12 w-12 rounded-full" />
          <div>
            <h1 className="text-lg text-white">{market.fullName}</h1>
            <p className="font-mono text-xs text-[#C9D5FF]">${market.symbol} · id {market.githubRepoId}</p>
          </div>
        </div>
        <p className="mt-3 text-sm text-[#9DA8BE]">{formatStars(market.stars)} stars · {market.language || "—"}</p>
        <p className="mt-2 text-sm text-white">{market.claimStatus === "active" ? "Claimed builder" : market.claimStatus === "pending" ? "Verification pending" : market.claimStatus === "revoked" ? "Claim revoked" : "Unclaimed"}</p>
        {market.claimStatus !== "active" && (
          <Link className="mt-4 inline-flex text-sm text-[#C9D5FF] underline" href={`/claim/${market.githubRepoId}`}>
            {claimLabel}
          </Link>
        )}
        <a className="mt-3 block text-sm text-[#C9D5FF]" href={`/graduate/${market.mint}`}>Graduate</a>
      </aside>
      <section>
        <p className="font-mono text-xs text-[#9CB7FF]">03 Trade</p>
        <div className="mt-3 overflow-hidden rounded-3xl border border-[#2B3150] bg-black">
          {graduated ? (
            <iframe title="DexScreener" src={`${dexscreenerUrl(market.mint)}?embed=1&theme=dark&info=0`} className="h-[420px] w-full" />
          ) : (
            <div className="flex h-[420px] flex-col justify-end p-6">
              <p className="text-sm text-[#9DA8BE]">Live curve state. Not historical candles. DexScreener is the chart once a pair exists.</p>
              <p className="mt-6 font-mono text-4xl text-white">{curve ? `${curve.marketCapSol.toFixed(2)} SOL` : "—"}</p>
              <p className="text-xs text-[#9DA8BE]">Bonding market cap in quote, read from reserves. No dollar price is invented.</p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full bg-[#9CB7FF]" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-2 text-xs text-[#C9D5FF]">{progress}% toward completion · reserves {curve ? `${curve.realQuoteSol.toFixed(3)} SOL` : "unread"}</p>
            </div>
          )}
        </div>
        {curveError && <p className="mt-3 text-sm text-[#FFB4BA]">{curveError} Curve math lives in pump-public-docs. This page does not guess a price.</p>}
        <div className="mt-4 flex gap-2 text-sm">
          {(["about", "holders", "txns", "builder"] as const).map((item) => (
            <button key={item} type="button" onClick={() => setTab(item)} className={`rounded-full px-3 py-1 ${tab === item ? "bg-white text-[#14120f]" : "text-[#9DA8BE]"}`}>{item}</button>
          ))}
        </div>
        <div className="mt-3 text-sm text-[#9DA8BE]">
          {tab === "about" && <p>{market.description || "No GitHub description."} <a className="text-white" href={market.htmlUrl}>Repo</a></p>}
          {tab === "holders" && <p>Holder index is not in Phase 1. Use Solscan. GitFuel will not draw a fake holder table.</p>}
          {tab === "txns" && <p>Transaction history is the wallet and Solscan. A local signature appears after you trade.</p>}
          {tab === "builder" && (
            <p>Status {market.claimStatus}. Payout {market.claimedWallet ? shortKey(market.claimedWallet) : "unbound"}. Claims prove GitHub adminship at verification time.</p>
          )}
        </div>
      </section>
      <aside className="rounded-3xl border border-[#2B3150] bg-[#111320] p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex rounded-full bg-black p-1">
            <button type="button" className={`rounded-full px-4 py-1 text-sm ${side === "buy" ? "bg-[#9CB7FF] text-[#0A1020]" : ""}`} onClick={() => setSide("buy")}>Buy</button>
            <button type="button" className={`rounded-full px-4 py-1 text-sm ${side === "sell" ? "bg-[#FF3B4A] text-white" : ""}`} onClick={() => setSide("sell")}>Sell</button>
          </div>
          <span className="rounded-full border border-[#2B3150] px-2 py-1 text-[10px] tracking-wide">{graduated ? "PumpSwap" : "Bonding"}</span>
        </div>
        <label className="text-xs text-[#9DA8BE]">{side === "buy" ? "SOL in" : "Tokens out of your wallet (6 decimals)"}</label>
        <input value={amount} onChange={(event) => setAmount(event.target.value)} className="mt-1 w-full rounded-2xl border border-[#2B3150] bg-black px-3 py-3 font-mono" />
        <label className="mt-3 block text-xs text-[#9DA8BE]">Slippage {slippage}%</label>
        <input type="range" min={1} max={15} value={slippage} onChange={(event) => setSlippage(Number(event.target.value))} className="w-full" />
        <p className="text-xs text-[#9DA8BE]">Quotes come from @pump-fun/pump-sdk against the live curve. Post-graduation swaps stay on PumpSwap and DexScreener.</p>
        <button type="button" disabled={busy || graduated} onClick={trade} className="mt-4 w-full rounded-full bg-[#9CB7FF] py-3 text-sm font-semibold text-[#0A1020] disabled:opacity-40">
          {graduated ? "Curve complete" : busy ? "Signing…" : wallet.connected ? `${side === "buy" ? "Buy" : "Sell"} on curve` : "Connect wallet"}
        </button>
        <button type="button" className="mt-2 w-full text-left text-xs text-[#C9D5FF]" onClick={() => navigator.clipboard.writeText(window.location.href)}>Share link</button>
        <button type="button" className="mt-3 w-full rounded-full border border-[#2B3150] py-2 text-xs" onClick={configureFees}>Configure proposed fee shares</button>
        <p className="mt-2 text-[11px] leading-relaxed text-[#9DA8BE]">Custodial interim: this signature sets 85% on the platform treasury (70% builder + 15% platform) and 15% on the launcher until an admin is bound. Not an escrow program.</p>
        {message && <a className="mt-3 block font-mono text-[11px] text-[#C9D5FF]" href={solscanMint(market.mint)}>{shortKey(message, 8)}</a>}
        {error && <p className="mt-3 text-xs text-[#FFB4BA]">{error}</p>}
        <a className="mt-3 block text-xs underline" href={pumpCoinUrl(market.mint)}>pump.fun</a>
        <a className="mt-1 block text-xs underline" href={dexscreenerUrl(market.mint)}>DexScreener</a>
      </aside>
    </div>
    </div>
  );
}

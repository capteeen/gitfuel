"use client";

import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import type { Market } from "@/lib/types";
import { dexscreenerUrl, pumpCoinUrl } from "@/lib/cluster";
import { explainChainError } from "@/lib/rpc-error";

export function GraduatePanel({ market }: { market: Market }) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { setVisible } = useWalletModal();
  const [progress, setProgress] = useState<number | null>(null);
  const [complete, setComplete] = useState(market.bondingComplete);
  const [pool, setPool] = useState(market.pumpswapPool);
  const [error, setError] = useState("");
  const [signature, setSignature] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { readCurve } = await import("@/lib/chain");
        const curve = await readCurve(connection, market.mint);
        if (!curve) return;
        setProgress(curve.progress);
        setComplete(curve.complete);
        setPool(curve.pool);
      } catch (cause) {
        setError(explainChainError(cause, "Could not read the curve."));
      }
    })();
  }, [connection, market.mint]);

  async function migrate() {
    if (!wallet.publicKey || !wallet.signTransaction) {
      setVisible(true);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { migrateCurve } = await import("@/lib/chain");
      const sig = await migrateCurve(connection, { publicKey: wallet.publicKey, signTransaction: wallet.signTransaction }, market.mint);
      setSignature(sig);
      setComplete(true);
    } catch (cause) {
      setError(explainChainError(cause, "Migrate failed."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <p className="font-mono text-xs text-[#9CB7FF]">05 Graduate</p>
      <h1 className="mt-2 font-display text-5xl text-white">Migrate to PumpSwap</h1>
      <p className="mt-4 text-[#9DA8BE]">When the bonding curve is complete, anyone can crank pump.fun’s migrate instruction. The canonical PumpSwap pool opens and LP is burned the way pump documents it. Repogo does not use Meteora.</p>
      <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full bg-[#9CB7FF]" style={{ width: `${Math.round((progress ?? (complete ? 1 : 0)) * 100)}%` }} />
      </div>
      <p className="mt-2 font-mono text-sm text-[#C9D5FF]">{complete ? "Curve complete" : progress == null ? "Progress unread on this RPC" : `${Math.round(progress * 100)}% of initial real token reserves sold`}</p>
      {!complete && <p className="mt-4 text-sm text-white">Not complete. The migrate button stays off. Only remaining progress is shown.</p>}
      {complete && !pool && (
        <button type="button" disabled={busy} onClick={migrate} className="mt-5 rounded-full bg-[#9CB7FF] px-5 py-3 text-sm font-semibold text-[#0A1020]">
          {busy ? "Signing migrate…" : "Migrate now"}
        </button>
      )}
      {pool && (
        <div className="mt-5 rounded-3xl border border-[#9CB7FF]/30 bg-[#9CB7FF]/10 p-5">
          <p className="text-sm text-white">PumpSwap pool</p>
          <p className="mt-2 font-mono text-xs text-[#C9D5FF]">{pool}</p>
          <a className="mt-3 inline-flex underline" href={dexscreenerUrl(market.mint)}>DexScreener pair</a>
        </div>
      )}
      {signature && <p className="mt-3 font-mono text-xs text-[#C9D5FF]">{signature}</p>}
      {error && <p className="mt-3 text-sm text-[#FFB4BA]">{error}</p>}
      <a className="mt-6 block text-sm underline" href={pumpCoinUrl(market.mint)}>pump.fun coin</a>
      <p className="mt-4 text-xs text-[#9DA8BE]">Instruction shape: <a className="underline" href="https://github.com/pump-fun/pump-public-docs/blob/main/docs/PUMP_PROGRAM_README.md">PUMP_PROGRAM_README</a>. Unsure accounts are not invented here.</p>
    </div>
  );
}

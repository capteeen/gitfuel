"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { shortKey } from "@/lib/format";
import { useCluster } from "./providers";

export function ConnectButton() {
  const { publicKey, connected, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const { cluster, setCluster } = useCluster();

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setCluster(cluster === "devnet" ? "mainnet-beta" : "devnet")}
        className="grid h-9 place-items-center rounded-full bg-white/10 px-3 text-[11px] font-semibold tracking-[0.14em] text-white"
        title="Toggle the Solana cluster used by the browser wallet"
      >
        {cluster === "devnet" ? "DEV" : "MAIN"}
      </button>
      {connected && publicKey ? (
        <div className="flex items-center gap-2 rounded-full bg-white/10 py-1 pl-1 pr-3 text-sm text-white">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-[#39FF14] text-[10px] font-bold text-[#071208]">
            {publicKey.toBase58().slice(0, 2)}
          </span>
          <span className="font-mono text-xs">{shortKey(publicKey.toBase58())}</span>
          <button type="button" className="text-[11px] text-white/70" onClick={() => disconnect()}>
            Disconnect
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setVisible(true)}
          className="rounded-full bg-white px-4 py-2 text-sm font-medium text-[#14120f]"
        >
          Connect wallet
        </button>
      )}
    </div>
  );
}

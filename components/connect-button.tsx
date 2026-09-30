"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { LogOut, Wallet } from "lucide-react";
import { shortKey } from "@/lib/format";

export function ConnectButton() {
  const { publicKey, connected, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  return (
    <div className="flex items-center gap-2">
      {connected && publicKey ? (
        <div className="flex min-h-10 items-center gap-2 rounded-md border border-white/15 px-3 text-white">
          <span className="font-mono text-[10px]">
            {shortKey(publicKey.toBase58(), 3)}
          </span>
          <button
            type="button"
            aria-label="Disconnect wallet"
            className="grid h-8 w-8 place-items-center text-white/60 hover:text-white"
            onClick={() => disconnect()}
          >
            <LogOut size={14} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setVisible(true)}
          className="flex min-h-10 items-center gap-2 rounded-md bg-[#dce4ff] px-3 text-[11px] font-semibold text-[#10172f] hover:bg-white"
        >
          <Wallet size={14} aria-hidden="true" />
          Connect wallet
        </button>
      )}
    </div>
  );
}

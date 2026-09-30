"use client";

import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { useMemo } from "react";
import { Buffer } from "buffer";
import { browserEndpoint } from "@/lib/cluster";
import "@solana/wallet-adapter-react-ui/styles.css";

if (!globalThis.Buffer) globalThis.Buffer = Buffer;

export function Providers({ children }: { children: React.ReactNode }) {
  const endpoint = useMemo(
    () => browserEndpoint(typeof window === "undefined" ? "http://127.0.0.1:3000" : window.location.origin),
    [],
  );
  const wallets = useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

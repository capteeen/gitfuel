"use client";

import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { createContext, useContext, useMemo, useState } from "react";
import { Buffer } from "buffer";
import { defaultCluster, publicEndpoint, type ClusterName } from "@/lib/cluster";
import "@solana/wallet-adapter-react-ui/styles.css";

if (!globalThis.Buffer) globalThis.Buffer = Buffer;

const ClusterContext = createContext<{
  cluster: ClusterName;
  setCluster: (cluster: ClusterName) => void;
  endpoint: string;
}>({
  cluster: "devnet",
  setCluster: () => {},
  endpoint: publicEndpoint("devnet"),
});

export function useCluster() {
  return useContext(ClusterContext);
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [cluster, setCluster] = useState<ClusterName>(defaultCluster());
  const endpoint = useMemo(() => publicEndpoint(cluster), [cluster]);
  const wallets = useMemo(() => [], []);

  return (
    <ClusterContext.Provider value={{ cluster, setCluster, endpoint }}>
      <ConnectionProvider endpoint={endpoint} key={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>{children}</WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </ClusterContext.Provider>
  );
}

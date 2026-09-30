export type ClusterName = "devnet" | "mainnet-beta";

export const PUMP_PROGRAM_ID = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";
export const PUMP_SWAP_PROGRAM_ID = "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA";

export function defaultCluster(): ClusterName {
  return process.env.NEXT_PUBLIC_SOLANA_CLUSTER === "mainnet-beta" ? "mainnet-beta" : "devnet";
}

export function publicEndpoint(cluster: ClusterName) {
  const custom = process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
  if (custom && cluster === defaultCluster()) return custom;
  return cluster === "mainnet-beta"
    ? "https://api.mainnet-beta.solana.com"
    : "https://api.devnet.solana.com";
}

export function serverRpc() {
  return process.env.SOLANA_RPC_URL || publicEndpoint(defaultCluster());
}

export function solscanTx(signature: string, cluster: ClusterName) {
  const base = `https://solscan.io/tx/${signature}`;
  return cluster === "devnet" ? `${base}?cluster=devnet` : base;
}

export function solscanMint(mint: string, cluster: ClusterName) {
  const base = `https://solscan.io/token/${mint}`;
  return cluster === "devnet" ? `${base}?cluster=devnet` : base;
}

export function pumpCoinUrl(mint: string) {
  return `https://pump.fun/coin/${mint}`;
}

export function dexscreenerUrl(mint: string) {
  return `https://dexscreener.com/solana/${mint}`;
}

export const platformTreasury = process.env.NEXT_PUBLIC_PLATFORM_TREASURY || "";

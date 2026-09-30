export const PUMP_PROGRAM_ID = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";
export const PUMP_SWAP_PROGRAM_ID = "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA";

export function publicEndpoint() {
  return process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
}

export function serverRpc() {
  return process.env.SOLANA_RPC_URL || publicEndpoint();
}

export function solscanTx(signature: string) {
  return `https://solscan.io/tx/${signature}`;
}

export function solscanMint(mint: string) {
  return `https://solscan.io/token/${mint}`;
}

export function pumpCoinUrl(mint: string) {
  return `https://pump.fun/coin/${mint}`;
}

export function dexscreenerUrl(mint: string) {
  return `https://dexscreener.com/solana/${mint}`;
}

export const platformTreasury = process.env.NEXT_PUBLIC_PLATFORM_TREASURY || "";

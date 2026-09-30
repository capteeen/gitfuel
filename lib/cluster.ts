export const PUMP_PROGRAM_ID = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";
export const PUMP_SWAP_PROGRAM_ID = "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA";

const PUBLIC_MAINNET_RPC = "https://api.mainnet-beta.solana.com";

export function publicEndpoint() {
  return process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.trim() || PUBLIC_MAINNET_RPC;
}

export function serverRpc() {
  return process.env.SOLANA_RPC_URL?.trim() || publicEndpoint();
}

/**
 * Endpoint for the wallet adapter. api.mainnet-beta.solana.com answers
 * getAccountInfo from a server and returns 403 when the request has a browser
 * Origin, so the default browser path is the same-origin /api/rpc proxy.
 * NEXT_PUBLIC_SOLANA_RPC_URL is used directly only when it is some other provider.
 */
export function browserEndpoint(origin: string) {
  const configured = process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.trim();
  if (configured && !isPublicSolanaRpc(configured)) return configured;
  return `${origin.replace(/\/$/, "")}/api/rpc`;
}

export function rpcTargetsDevnet(url: string) {
  try {
    return new URL(url).hostname.includes("devnet");
  } catch {
    return /devnet/i.test(url);
  }
}

function isPublicSolanaRpc(url: string) {
  try {
    const host = new URL(url).hostname;
    return host === "api.mainnet-beta.solana.com" || host === "api.devnet.solana.com";
  } catch {
    return false;
  }
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

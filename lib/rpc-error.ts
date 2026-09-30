export const RPC_REJECTED =
  "The Solana RPC rejected this request. Set SOLANA_RPC_URL to a mainnet endpoint, or NEXT_PUBLIC_SOLANA_RPC_URL if that provider allows browser calls.";

export const DEVNET_PUMP_BLOCK =
  "pump.fun launches require Solana mainnet. This RPC is devnet, and the pump.fun global account is not on devnet.";

function messageOf(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "";
}

function redactSecrets(message: string) {
  return message.replace(/https?:\/\/[^\s"'<>]+/gi, (url) => {
    try {
      const parsed = new URL(url);
      if (!parsed.username && !parsed.password && !parsed.search) return url;
      return `${parsed.origin}${parsed.pathname}`;
    } catch {
      return "[rpc]";
    }
  });
}

export function explainChainError(error: unknown, fallback: string) {
  const message = messageOf(error);
  if (/access forbidden|\b403\b|the solana rpc rejected this request/i.test(message)) {
    return RPC_REJECTED;
  }
  if (/encoding overruns Uint8Array|encoding overruns Buffer|Transaction too large/i.test(message)) {
    return "This transaction is larger than Solana allows (1232 bytes). Shorten the metadata URI and try again.";
  }
  const cleaned = redactSecrets(message).trim();
  return cleaned || fallback;
}

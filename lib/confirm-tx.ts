import { Connection, PublicKey, type VersionedTransactionResponse } from "@solana/web3.js";
import { PUMP_PROGRAM_ID, serverRpc } from "./cluster";

function accountKeys(tx: VersionedTransactionResponse) {
  const message = tx.transaction.message;
  const loaded = tx.meta?.loadedAddresses;
  if ("getAccountKeys" in message && typeof message.getAccountKeys === "function") {
    try {
      const resolved = message.getAccountKeys(
        loaded ? { accountKeysFromLookups: loaded } : undefined,
      );
      return resolved.keySegments().flat().map((key) => key.toBase58());
    } catch {
      // Fall through to the static key list when lookup tables are missing.
    }
  }
  const legacy = message as {
    staticAccountKeys?: { toBase58(): string }[];
    accountKeys?: { toBase58(): string }[];
  };
  return [...(legacy.staticAccountKeys || []), ...(legacy.accountKeys || [])].map((key) => key.toBase58());
}

async function loadConfirmed(connection: Connection, signature: string) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const tx = await connection.getTransaction(signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });
    if (tx) return tx;
    await new Promise((resolve) => setTimeout(resolve, 1200));
  }
  return null;
}

export async function assertConfirmedCreate(signature: string, mint: string, launcher: string) {
  try {
    new PublicKey(mint);
    new PublicKey(launcher);
  } catch {
    throw new Error("Mint or launcher is not a Solana address.");
  }
  if (!/^[1-9A-HJ-NP-Za-km-z]{64,100}$/.test(signature)) {
    throw new Error("Create signature is not a transaction signature.");
  }
  const connection = new Connection(serverRpc(), "confirmed");
  const tx = await loadConfirmed(connection, signature);
  if (!tx) {
    throw new Error("Create transaction is not confirmed on this RPC yet. Retry in a moment. GitFuel will not register an unconfirmed mint.");
  }
  if (tx.meta?.err) {
    throw new Error("That transaction failed on-chain. GitFuel will not register it.");
  }
  const logs = tx.meta?.logMessages || [];
  if (!logs.some((line) => line.includes("Instruction: CreateV2"))) {
    throw new Error("That transaction is confirmed, but it is not a pump.fun create_v2.");
  }
  const keys = accountKeys(tx);
  if (!keys.includes(PUMP_PROGRAM_ID)) {
    throw new Error("That transaction does not call the pump.fun program.");
  }
  if (!keys.includes(mint) || !keys.includes(launcher)) {
    throw new Error("That transaction does not include both the mint and the launcher wallet.");
  }
}

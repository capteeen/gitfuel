import { Connection, PublicKey } from "@solana/web3.js";
import { serverRpc } from "./cluster";

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
  const tx = await connection.getTransaction(signature, {
    commitment: "confirmed",
    maxSupportedTransactionVersion: 0,
  });
  if (!tx) {
    throw new Error("Create transaction is not confirmed on this RPC yet. Retry in a moment. GitFuel will not register an unconfirmed mint.");
  }
  const message = tx.transaction.message as {
    staticAccountKeys?: { toBase58(): string }[];
    accountKeys?: { toBase58(): string }[];
  };
  const keys = [...(message.staticAccountKeys || []), ...(message.accountKeys || [])].map((key) => key.toBase58());
  if (!keys.includes(mint) || !keys.includes(launcher)) {
    throw new Error("That transaction does not include both the mint and the launcher wallet.");
  }
}

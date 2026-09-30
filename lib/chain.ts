import { ComputeBudgetProgram, Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, Transaction, type TransactionInstruction } from "@solana/web3.js";
import BN from "bn.js";
import {
  OnlinePumpSdk,
  PUMP_SDK,
  bondingCurveMarketCap,
  bondingCurvePda,
  canonicalPumpPoolPda,
  feeSharingConfigPda,
  getBuyTokenAmountFromSolAmount,
  getSellSolAmountFromTokenAmount,
} from "@pump-fun/pump-sdk";

export const NATIVE_MINT = new PublicKey("So11111111111111111111111111111111111111112");
const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

type WalletSigner = {
  publicKey: PublicKey;
  signTransaction: (tx: Transaction) => Promise<Transaction>;
};

function uiToRaw(value: string, decimals: number) {
  const cleaned = value.trim();
  if (!/^\d+(\.\d+)?$/.test(cleaned)) throw new Error("Enter a positive token amount.");
  const [whole, fraction = ""] = cleaned.split(".");
  const frac = (fraction + "0".repeat(decimals)).slice(0, decimals);
  return new BN(whole).mul(new BN(10).pow(new BN(decimals))).add(new BN(frac || "0"));
}

async function sendInstructions(
  connection: Connection,
  wallet: WalletSigner,
  instructions: TransactionInstruction[],
  extra: Keypair[] = [],
) {
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  const tx = new Transaction();
  tx.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }), ...instructions);
  tx.feePayer = wallet.publicKey;
  tx.recentBlockhash = blockhash;
  if (extra.length) tx.partialSign(...extra);
  const signed = await wallet.signTransaction(tx);
  const signature = await connection.sendRawTransaction(signed.serialize(), { skipPreflight: false });
  await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");
  return signature;
}

export async function readCurve(connection: Connection, mintAddress: string) {
  const mint = new PublicKey(mintAddress);
  const online = new OnlinePumpSdk(connection);
  const info = await connection.getAccountInfo(bondingCurvePda(mint));
  if (!info) return null;
  const curve = PUMP_SDK.decodeBondingCurve(info);
  const global = await online.fetchGlobal();
  const pool = canonicalPumpPoolPda(mint);
  const poolInfo = await connection.getAccountInfo(pool);
  const initial = global.initialRealTokenReserves;
  let progress = curve.complete ? 1 : 0;
  if (!curve.complete && initial.gtn(0)) {
    const left = BN.min(curve.realTokenReserves, initial);
    progress = initial.sub(left).muln(10000).div(initial).toNumber() / 10000;
  }
  const mcapLamports = bondingCurveMarketCap({
    mintSupply: curve.tokenTotalSupply,
    virtualQuoteReserves: curve.virtualQuoteReserves,
    virtualTokenReserves: curve.virtualTokenReserves,
  });
  return {
    complete: curve.complete,
    progress,
    creator: curve.creator.toBase58(),
    realQuoteSol: curve.realQuoteReserves.toNumber() / LAMPORTS_PER_SOL,
    marketCapSol: mcapLamports.toNumber() / LAMPORTS_PER_SOL,
    pool: poolInfo ? pool.toBase58() : null,
    programPresent: true,
  };
}

export async function createCoin(
  connection: Connection,
  wallet: WalletSigner,
  input: { name: string; symbol: string; uri: string; solBuy?: number },
) {
  const online = new OnlinePumpSdk(connection);
  const global = await online.fetchGlobal();
  const feeConfig = await online.fetchFeeConfig().catch(() => null);
  const mintKeypair = Keypair.generate();
  const user = wallet.publicKey;
  let instructions: TransactionInstruction[];
  if (input.solBuy && input.solBuy > 0) {
    const quoteAmount = new BN(Math.round(input.solBuy * LAMPORTS_PER_SOL));
    const amount = getBuyTokenAmountFromSolAmount({
      global,
      feeConfig,
      mintSupply: null,
      bondingCurve: null,
      amount: quoteAmount,
      quoteMint: NATIVE_MINT,
    });
    instructions = await PUMP_SDK.createV2AndBuyV2Instructions({
      global,
      mint: mintKeypair.publicKey,
      name: input.name,
      symbol: input.symbol,
      uri: input.uri,
      creator: user,
      user,
      amount,
      quoteAmount,
      mayhemMode: false,
    });
  } else {
    instructions = [
      await PUMP_SDK.createV2Instruction({
        mint: mintKeypair.publicKey,
        name: input.name,
        symbol: input.symbol,
        uri: input.uri,
        creator: user,
        user,
        mayhemMode: false,
      }),
    ];
  }
  const signature = await sendInstructions(connection, wallet, instructions, [mintKeypair]);
  return { signature, mint: mintKeypair.publicKey.toBase58() };
}

export async function buyOnCurve(connection: Connection, wallet: WalletSigner, mintAddress: string, sol: number, slippage: number) {
  if (!(sol > 0)) throw new Error("Enter a SOL amount.");
  const mint = new PublicKey(mintAddress);
  const online = new OnlinePumpSdk(connection);
  const [global, feeConfig, state] = await Promise.all([
    online.fetchGlobal(),
    online.fetchFeeConfig().catch(() => null),
    online.fetchBuyState(mint, wallet.publicKey),
  ]);
  if (state.bondingCurve.complete) {
    throw new Error("This curve is complete. Graduate, then trade the PumpSwap pair. DexScreener is the price surface.");
  }
  const quoteAmount = new BN(Math.round(sol * LAMPORTS_PER_SOL));
  const amount = getBuyTokenAmountFromSolAmount({
    global,
    feeConfig,
    mintSupply: state.bondingCurve.tokenTotalSupply,
    bondingCurve: state.bondingCurve,
    amount: quoteAmount,
    quoteMint: state.quoteMint,
  });
  const instructions = await PUMP_SDK.buyV2Instructions({
    global,
    bondingCurveAccountInfo: state.bondingCurveAccountInfo,
    bondingCurve: state.bondingCurve,
    associatedUserAccountInfo: state.associatedUserAccountInfo,
    mint,
    user: wallet.publicKey,
    amount,
    quoteAmount,
    slippage,
    quoteTokenProgram: state.quoteTokenProgram,
  });
  return sendInstructions(connection, wallet, instructions);
}

export async function sellOnCurve(
  connection: Connection,
  wallet: WalletSigner,
  mintAddress: string,
  tokenAmount: string,
  slippage: number,
) {
  const mint = new PublicKey(mintAddress);
  const online = new OnlinePumpSdk(connection);
  const [global, feeConfig, state] = await Promise.all([
    online.fetchGlobal(),
    online.fetchFeeConfig().catch(() => null),
    online.fetchSellState(mint, wallet.publicKey),
  ]);
  if (state.bondingCurve.complete) {
    throw new Error("This curve is complete. Bonding sells are closed. Use the PumpSwap pair.");
  }
  const amount = uiToRaw(tokenAmount, 6);
  if (amount.lten(0)) throw new Error("Enter a token amount.");
  const quoteAmount = getSellSolAmountFromTokenAmount({
    global,
    feeConfig,
    mintSupply: state.bondingCurve.tokenTotalSupply,
    bondingCurve: state.bondingCurve,
    amount,
  });
  const instructions = await PUMP_SDK.sellV2Instructions({
    global,
    bondingCurveAccountInfo: state.bondingCurveAccountInfo,
    bondingCurve: state.bondingCurve,
    mint,
    user: wallet.publicKey,
    amount,
    quoteAmount,
    slippage,
    quoteTokenProgram: state.quoteTokenProgram,
  });
  return sendInstructions(connection, wallet, instructions);
}

export async function migrateCurve(connection: Connection, wallet: WalletSigner, mintAddress: string) {
  const mint = new PublicKey(mintAddress);
  const online = new OnlinePumpSdk(connection);
  const info = await connection.getAccountInfo(bondingCurvePda(mint));
  if (!info) throw new Error("No bonding curve account on this cluster.");
  const curve = PUMP_SDK.decodeBondingCurve(info);
  if (!curve.complete) throw new Error("Curve is not complete. Migration stays disabled.");
  const global = await online.fetchGlobal();
  const solLike = curve.quoteMint.equals(PublicKey.default) || curve.quoteMint.equals(NATIVE_MINT);
  const instruction = solLike
    ? await PUMP_SDK.migrateInstruction({
        withdrawAuthority: global.withdrawAuthority,
        mint,
        user: wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
    : await PUMP_SDK.migrateV2Instruction({
        withdrawAuthority: global.withdrawAuthority,
        mint,
        user: wallet.publicKey,
        quoteMint: curve.quoteMint,
        baseTokenProgram: TOKEN_PROGRAM_ID,
        quoteTokenProgram: await online.fetchQuoteTokenProgram(curve.quoteMint),
      });
  return sendInstructions(connection, wallet, [instruction]);
}

export async function readSharing(connection: Connection, mintAddress: string) {
  const mint = new PublicKey(mintAddress);
  const info = await connection.getAccountInfo(feeSharingConfigPda(mint));
  if (!info) return null;
  const config = PUMP_SDK.decodeSharingConfig(info);
  return {
    admin: config.admin.toBase58(),
    adminRevoked: config.adminRevoked,
    shareholders: config.shareholders.map((share) => ({
      address: share.address.toBase58(),
      shareBps: share.shareBps,
    })),
  };
}

export async function configureCustodialShares(
  connection: Connection,
  wallet: WalletSigner,
  mintAddress: string,
  treasuryAddress: string,
) {
  const mint = new PublicKey(mintAddress);
  const treasury = new PublicKey(treasuryAddress);
  if (treasury.equals(wallet.publicKey)) {
    throw new Error("Platform treasury must be a different pubkey than the launcher.");
  }
  const existing = await connection.getAccountInfo(feeSharingConfigPda(mint));
  if (!existing) {
    await sendInstructions(connection, wallet, [
      await PUMP_SDK.createFeeSharingConfig({ creator: wallet.publicKey, mint, pool: null }),
    ]);
  }
  const config = await readSharing(connection, mintAddress);
  if (!config) throw new Error("Fee-sharing config was not found after create.");
  if (config.admin !== wallet.publicKey.toBase58()) {
    throw new Error("Connected wallet is not the sharing-config admin.");
  }
  const instruction = await PUMP_SDK.updateFeeShares({
    authority: wallet.publicKey,
    mint,
    currentShareholders: config.shareholders.map((share) => new PublicKey(share.address)),
    newShareholders: [
      { address: treasury, shareBps: 8500 },
      { address: wallet.publicKey, shareBps: 1500 },
    ],
  });
  return sendInstructions(connection, wallet, [instruction]);
}

export async function assignBuilderShare(
  connection: Connection,
  wallet: WalletSigner,
  input: { mint: string; builder: string; launcher: string; treasury: string },
) {
  const mint = new PublicKey(input.mint);
  const config = await readSharing(connection, input.mint);
  if (!config) throw new Error("No fee-sharing config on this mint yet.");
  if (config.admin !== wallet.publicKey.toBase58()) {
    throw new Error("Only the sharing-config admin can update shares. GitFuel does not move funds for them.");
  }
  const buckets = new Map<string, number>();
  const add = (address: string, bps: number) => buckets.set(address, (buckets.get(address) || 0) + bps);
  add(input.builder, 7000);
  add(input.launcher, 1500);
  add(input.treasury, 1500);
  const instruction = await PUMP_SDK.updateFeeShares({
    authority: wallet.publicKey,
    mint,
    currentShareholders: config.shareholders.map((share) => new PublicKey(share.address)),
    newShareholders: [...buckets.entries()].map(([address, shareBps]) => ({
      address: new PublicKey(address),
      shareBps,
    })),
  });
  return sendInstructions(connection, wallet, [instruction]);
}

export async function readVaults(connection: Connection, creator: string) {
  const online = new OnlinePumpSdk(connection);
  const rows = await online.getCreatorVaultQuoteBalances(new PublicKey(creator));
  return rows.map((row) => ({
    mint: row.mint.toBase58(),
    pump: row.pumpVault.toString(),
    amm: row.ammVault.toString(),
    total: row.total.toString(),
    sol: row.mint.equals(NATIVE_MINT) || row.mint.equals(PublicKey.default) ? row.total.toNumber() / LAMPORTS_PER_SOL : null,
  }));
}

export async function rentEstimate(connection: Connection) {
  const lamports = await connection.getMinimumBalanceForRentExemption(82);
  return lamports / LAMPORTS_PER_SOL;
}

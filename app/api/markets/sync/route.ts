import { NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";
import { OnlinePumpSdk, PUMP_SDK, bondingCurvePda, canonicalPumpPoolPda } from "@pump-fun/pump-sdk";
import { z } from "zod";
import { rpcTargetsDevnet, serverRpc } from "@/lib/cluster";
import { DEVNET_PUMP_BLOCK, explainChainError } from "@/lib/rpc-error";
import { getMarketByMint, launchRegistryBlock, updateCurve } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({ mint: z.string().min(32) });

export async function POST(request: Request) {
  const blocked = await launchRegistryBlock();
  if (blocked) {
    return NextResponse.json({ error: blocked }, { status: 503 });
  }
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Mint required." }, { status: 400 });
  const market = await getMarketByMint(parsed.data.mint);
  if (!market) return NextResponse.json({ error: "Market missing." }, { status: 404 });
  try {
    const upstream = serverRpc();
    if (rpcTargetsDevnet(upstream)) {
      return NextResponse.json({ error: DEVNET_PUMP_BLOCK, market }, { status: 400 });
    }
    const mint = new PublicKey(parsed.data.mint);
    const connection = new Connection(upstream, "confirmed");
    const online = new OnlinePumpSdk(connection);
    const info = await connection.getAccountInfo(bondingCurvePda(mint));
    if (!info) return NextResponse.json({ error: "No bonding curve on the server RPC.", market });
    const curve = PUMP_SDK.decodeBondingCurve(info);
    const pool = canonicalPumpPoolPda(mint);
    const poolInfo = await connection.getAccountInfo(pool);
    const pumpswapPool: string | null = poolInfo ? pool.toBase58() : null;
    if (curve.complete && !pumpswapPool) {
      await online.fetchGlobal();
    }
    const updated = await updateCurve(parsed.data.mint, curve.complete, pumpswapPool);
    return NextResponse.json({ market: updated });
  } catch (error) {
    const message = explainChainError(error, "Curve sync failed.");
    return NextResponse.json({ error: message, market }, { status: 502 });
  }
}

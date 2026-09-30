import { NextResponse } from "next/server";
import { rpcTargetsDevnet, serverRpc } from "@/lib/cluster";
import { DEVNET_PUMP_BLOCK, RPC_REJECTED } from "@/lib/rpc-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_METHODS = new Set([
  "getAccountInfo",
  "getBalance",
  "getBlockHeight",
  "getEpochInfo",
  "getFeeForMessage",
  "getHealth",
  "getLatestBlockhash",
  "getMinimumBalanceForRentExemption",
  "getMultipleAccounts",
  "getRecentPrioritizationFees",
  "getSignatureStatuses",
  "getSlot",
  "getTokenAccountBalance",
  "getTokenAccountsByOwner",
  "getTransaction",
  "isBlockhashValid",
  "sendTransaction",
  "simulateTransaction",
]);

const MAX_BYTES = 512_000;

type RpcCall = { jsonrpc?: unknown; method?: unknown; id?: unknown };

function jsonRpcId(id: unknown) {
  if (typeof id === "string" || typeof id === "number" || id === null) return id;
  return null;
}

function asCalls(payload: unknown): RpcCall[] | null {
  if (Array.isArray(payload)) {
    if (payload.length === 0 || payload.length > 32) return null;
    if (!payload.every((item) => item && typeof item === "object")) return null;
    return payload as RpcCall[];
  }
  if (payload && typeof payload === "object") return [payload as RpcCall];
  return null;
}

function rpcError(id: unknown, code: number, message: string, status = 200) {
  return NextResponse.json(
    { jsonrpc: "2.0", error: { code, message }, id: jsonRpcId(id) },
    { status },
  );
}

export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > MAX_BYTES) {
    return rpcError(null, -32600, "Request too large.", 413);
  }
  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return rpcError(null, -32700, "Parse error.", 400);
  }
  const calls = asCalls(payload);
  if (!calls) return rpcError(null, -32600, "Invalid request.", 400);
  for (const call of calls) {
    if (call.jsonrpc !== "2.0" || typeof call.method !== "string") {
      return rpcError(call.id, -32600, "Invalid request.", 400);
    }
    if (!ALLOWED_METHODS.has(call.method)) {
      return rpcError(call.id, -32601, `RPC method is not proxied: ${call.method}`);
    }
  }

  const upstreamUrl = serverRpc();
  if (rpcTargetsDevnet(upstreamUrl)) {
    const id = Array.isArray(payload) ? null : (payload as RpcCall).id;
    return rpcError(id, -32000, DEVNET_PUMP_BLOCK);
  }

  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: raw,
      cache: "no-store",
      redirect: "error",
    });
  } catch {
    const id = Array.isArray(payload) ? null : (payload as RpcCall).id;
    return rpcError(id, -32000, "The Solana RPC could not be reached.", 502);
  }

  if (upstream.status === 401 || upstream.status === 403) {
    if (Array.isArray(payload)) {
      return NextResponse.json(payload.map((call) => ({
        jsonrpc: "2.0",
        error: { code: 403, message: RPC_REJECTED },
        id: jsonRpcId((call as RpcCall).id),
      })));
    }
    return rpcError((payload as RpcCall).id, 403, RPC_REJECTED);
  }

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.ok ? 200 : upstream.status,
    headers: { "content-type": upstream.headers.get("content-type") || "application/json" },
  });
}

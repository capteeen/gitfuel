# GitFuel

Open-source markets on Solana. Paste a public GitHub repository, launch a coin on **pump.fun** (bonding curve → PumpSwap, not Meteora), and route creator fees toward a verified GitHub owner or admin.

`$GITFUEL` revenue policy in the app is **proposed**. The buyback page does not invent transactions.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Requires Node 22 (built-in `node:sqlite` for the local registry at `data/gitfuel.sqlite`).

## Deploy on Vercel

The local SQLite file cannot persist in Vercel Functions. Connect a Turso database and set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` in the Vercel project environment before enabling launches. The tables are created on first use. Redeploy after adding the variables. Without both values, the public site remains readable, while launches and claims are disabled so no signed transaction depends on an ephemeral registry.

Public launch listings use Supabase. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, then run `supabase/migrations/20260930120000_markets.sql` in the Supabase SQL editor. New markets are written there from the launch API and shown on the home page, newest first. SQLite (or Turso) still caches repos, metadata, and claims.

## Solana RPC

GitFuel connects to Solana mainnet-beta. Launches require a funded mainnet wallet. pump.fun's global account is mainnet-only, so a devnet RPC cannot launch or quote a coin.

The public endpoint `https://api.mainnet-beta.solana.com` is the default when `SOLANA_RPC_URL` and `NEXT_PUBLIC_SOLANA_RPC_URL` are empty. It answers `getAccountInfo` from the server and returns HTTP 403 when a browser sends an `Origin` header. Wallet and pump.fun reads therefore go through `/api/rpc`, which forwards to `SOLANA_RPC_URL`, then `NEXT_PUBLIC_SOLANA_RPC_URL`, then that public endpoint, without the browser origin. Set `NEXT_PUBLIC_SOLANA_RPC_URL` only for a provider that allows browser calls. Both custom endpoints must be mainnet-beta. A paid key is optional; the public endpoint still serves the proxy.

Copy `.env.example` to `.env.local`.

## What signs

Creates, buys, sells, migrates, and fee-share updates are user-signed with Wallet Adapter (wallet-standard: Phantom, Solflare, Backpack). The server confirms the create signature before it will store `github_repo_id → mint`. One market per numeric GitHub id.

Proposed creator-fee split: 70% verified admin, 15% launcher, 15% platform. Until claim, the launcher can sign a pump fee-sharing config that parks 85% on `NEXT_PUBLIC_PLATFORM_TREASURY` (builder 70% plus platform 15%) and 15% on the launcher. That custodial interim is labeled in the UI. It is not a custom escrow program.

## Not in this build

Live `$GITFUEL` buybacks, private repos, Meteora launches, dispute resolution beyond a link to `/legal`.

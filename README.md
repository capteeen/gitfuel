# GitFuel

Open-source markets on Solana. Paste a public GitHub repository, launch a coin on **pump.fun** (bonding curve → PumpSwap, not Meteora), and route creator fees toward a verified GitHub owner or admin.

`$GFUL` revenue policy in the app is **proposed**. The buyback page does not invent transactions.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Requires Node 22 (built-in `node:sqlite` for the local registry at `data/gitfuel.sqlite`).

## Cluster

`NEXT_PUBLIC_SOLANA_CLUSTER` is `devnet` by default. The header **DEV / MAIN** pill switches the browser RPC between public devnet and public mainnet-beta.

pump.fun’s bonding program `6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P` is the mainnet program id from pump-public-docs. A devnet create only succeeds if that program is actually deployed on the RPC you are using. If it is not, the wallet error is shown as-is. Set `NEXT_PUBLIC_SOLANA_CLUSTER=mainnet-beta` and a funded mainnet wallet to target mainnet. `SOLANA_RPC_URL` is what API routes use when they confirm a create signature; `NEXT_PUBLIC_SOLANA_RPC_URL` is the browser connection when it matches the default cluster.

Copy `.env.example` to `.env.local`.

## What signs

Creates, buys, sells, migrates, and fee-share updates are user-signed with Wallet Adapter (wallet-standard: Phantom, Solflare, Backpack). The server confirms the create signature before it will store `github_repo_id → mint`. One market per numeric GitHub id.

Proposed creator-fee split: 70% verified admin, 15% launcher, 15% platform. Until claim, the launcher can sign a pump fee-sharing config that parks 85% on `NEXT_PUBLIC_PLATFORM_TREASURY` (builder 70% plus platform 15%) and 15% on the launcher. That custodial interim is labeled in the UI. It is not a custom escrow program.

## Not in this build

Live `$GFUL` buybacks, private repos, Meteora launches, dispute resolution beyond a link to `/legal`.

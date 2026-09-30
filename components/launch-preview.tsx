"use client";

import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import type { Market, RepoPreview } from "@/lib/types";
import { platformTreasury, pumpCoinUrl, solscanMint } from "@/lib/cluster";
import { explainChainError } from "@/lib/rpc-error";
import { suggestSymbol } from "@/lib/format";

export function LaunchPreview({ repo, market, symbols }: { repo: RepoPreview; market: Market | null; symbols: string[] }) {
  const { connection } = useConnection();
  const { publicKey, signTransaction, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const [name, setName] = useState(repo.name.slice(0, 32));
  const [symbol, setSymbol] = useState(suggestSymbol(repo.name));
  const [description, setDescription] = useState(repo.description || repo.fullName);
  const [image, setImage] = useState(repo.avatarUrl);
  const [solBuy, setSolBuy] = useState("");
  const [rent, setRent] = useState<number | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [created, setCreated] = useState<{ mint: string; signature: string; buySignature?: string } | null>(null);
  const [buyWarning, setBuyWarning] = useState("");
  const taken = symbols.includes(symbol) && market?.symbol !== symbol;

  useEffect(() => {
    let cancel = false;
    connection.getMinimumBalanceForRentExemption(82).then((lamports) => {
      if (!cancel) setRent(lamports / 1_000_000_000);
    }).catch((cause) => {
      if (cancel) return;
      setRent(null);
      setError(explainChainError(cause, "Mint rent could not be read."));
    });
    return () => {
      cancel = true;
    };
  }, [connection]);

  async function launch() {
    if (!publicKey || !signTransaction) {
      setVisible(true);
      return;
    }
    setError("");
    setBuyWarning("");
    setBusy("Hosting metadata…");
    try {
      const meta = await fetch("/api/metadata/" + repo.githubRepoId, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          githubRepoId: repo.githubRepoId,
          name,
          symbol,
          description: description.slice(0, 500),
          image,
          website: repo.htmlUrl,
        }),
      });
      const metaBody = await meta.json();
      if (!meta.ok) throw new Error(metaBody.error || "Metadata failed.");
      setBusy(solBuy ? "Waiting for the wallet to sign create_v2. A first buy is a second signature." : "Waiting for the wallet to sign create_v2…");
      const { createCoin } = await import("@/lib/chain");
      const result = await createCoin(connection, { publicKey, signTransaction }, {
        name,
        symbol,
        uri: metaBody.uri,
        solBuy: solBuy ? Number(solBuy) : undefined,
      }, (message) => setBusy(message));
      setBusy("Registering the GitHub id…");
      const registered = await fetch("/api/markets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          githubRepoId: repo.githubRepoId,
          owner: repo.owner,
          repo: repo.name,
          coinName: name,
          symbol,
          mint: result.mint,
          metadataUri: metaBody.uri,
          imageUrl: image,
          launcher: publicKey.toBase58(),
          signature: result.signature,
        }),
      });
      const registeredBody = await registered.json();
      if (!registered.ok) throw new Error(registeredBody.error || "Registry rejected the mint.");
      setCreated(result);
      if (result.buyError) {
        setBuyWarning(`Coin created. The first buy did not land. ${result.buyError}`);
      }
      setBusy("");
    } catch (cause) {
      setBusy("");
      setError(explainChainError(cause, "Create failed."));
    }
  }

  if (market) {
    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-5xl text-white">Already launched</h1>
        <p className="mt-3 text-[#9DA8BE]">GitHub id {repo.githubRepoId} already maps to a mint. Duplicate markets are blocked.</p>
        <a className="mt-5 inline-flex rounded-full bg-white px-4 py-2 text-sm text-[#14120f]" href={`/market/${market.mint}`}>Open trade</a>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div>
        <p className="font-mono text-xs text-[#9CB7FF]">02 Launch</p>
        <h1 className="mt-2 font-display text-5xl text-white">Launch preview</h1>
        <p className="mt-3 text-sm text-[#9DA8BE]">Launches on pump.fun bonding curve. Graduates to PumpSwap — not Meteora.</p>
        <label htmlFor="launch-name" className="mt-5 block text-xs text-[#9DA8BE]">Name</label>
        <input id="launch-name" value={name} maxLength={32} onChange={(event) => setName(event.target.value)} className="mt-1 w-full rounded-2xl border border-[#2B3150] bg-[#111320] px-4 py-3" />
        <label htmlFor="launch-symbol" className="mt-4 block text-xs text-[#9DA8BE]">Symbol</label>
        <input id="launch-symbol" value={symbol} maxLength={10} onChange={(event) => setSymbol(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10))} className="mt-1 w-full rounded-2xl border border-[#2B3150] bg-[#111320] px-4 py-3 font-mono" />
        {taken && <p className="mt-1 text-xs text-[#FFB4BA]">Another GitFuel market already uses this symbol. Symbols are not unique on pump.fun, but the warning stands.</p>}
        <label htmlFor="launch-description" className="mt-4 block text-xs text-[#9DA8BE]">Description</label>
        <textarea id="launch-description" value={description} onChange={(event) => setDescription(event.target.value)} className="mt-1 h-24 w-full rounded-2xl border border-[#2B3150] bg-[#111320] px-4 py-3" />
        <label htmlFor="launch-image" className="mt-4 block text-xs text-[#9DA8BE]">Image URL</label>
        <input id="launch-image" value={image} onChange={(event) => setImage(event.target.value)} className="mt-1 w-full rounded-2xl border border-[#2B3150] bg-[#111320] px-4 py-3 text-sm" />
        <label htmlFor="launch-solBuy" className="mt-4 block text-xs text-[#9DA8BE]">Optional first buy (SOL)</label>
        <input id="launch-solBuy" value={solBuy} onChange={(event) => setSolBuy(event.target.value)} inputMode="decimal" placeholder="0" className="mt-1 w-full rounded-2xl border border-[#2B3150] bg-[#111320] px-4 py-3" />
        <p className="mt-1 text-[11px] text-[#9DA8BE]">A first buy is a second wallet signature after the coin is created.</p>
      </div>
      <aside className="rounded-3xl border border-[#2B3150] bg-[#111320] p-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt="" className="h-16 w-16 rounded-2xl object-cover" />
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between gap-4"><dt className="text-[#9DA8BE]">Website</dt><dd className="truncate font-mono text-xs">{repo.htmlUrl}</dd></div>
          <div className="flex justify-between"><dt className="text-[#9DA8BE]">GitHub ID</dt><dd className="font-mono text-[#C9D5FF]">{repo.githubRepoId}</dd></div>
          <div className="flex justify-between"><dt className="text-[#9DA8BE]">Mint rent</dt><dd>{rent == null ? "RPC unread" : `${rent.toFixed(4)} SOL`}</dd></div>
        </dl>
        <p className="mt-4 text-xs leading-relaxed text-[#9DA8BE]">Mint rent is the only figure read from chain. Protocol fees are whatever pump.fun charges when the transaction lands. You sign create_v2. GitFuel does not use a hot wallet.</p>
        <details className="mt-4 text-xs text-[#9DA8BE]">
          <summary className="cursor-pointer text-white">Creator fee recipients · proposed</summary>
          <p className="mt-2">70% verified admin, 15% launcher, 15% platform. Until a claim, the launcher can sign a fee-sharing config that parks 85% on the platform treasury and 15% on the launcher. That custodial interim is labeled on the trade page. Treasury: {platformTreasury || "set NEXT_PUBLIC_PLATFORM_TREASURY"}.</p>
        </details>
        {!connected ? (
          <button type="button" className="mt-5 w-full rounded-full bg-white py-3 text-sm font-medium text-[#14120f]" onClick={() => setVisible(true)}>Connect wallet</button>
        ) : (
          <button type="button" className="mt-5 w-full rounded-full bg-[#9CB7FF] py-3 text-sm font-semibold text-[#0A1020] disabled:opacity-50" disabled={Boolean(busy)} onClick={launch}>
            {busy || "Confirm launch"}
          </button>
        )}
        {metaNote(created)}
        {buyWarning && <p className="mt-3 text-sm text-[#FFB4BA]">{buyWarning}</p>}
        {error && <p className="mt-3 text-sm text-[#FFB4BA]">{error}</p>}
        {created && (
          <div className="mt-4 space-y-2 text-sm">
            <p className="font-mono text-xs text-[#C9D5FF]">{created.mint}</p>
            <a className="block underline" href={pumpCoinUrl(created.mint)}>pump.fun</a>
            <a className="block underline" href={solscanMint(created.mint)}>Solscan</a>
            <a className="inline-flex rounded-full bg-white px-3 py-1.5 text-[#14120f]" href={`/market/${created.mint}`}>Add to Discover</a>
          </div>
        )}
      </aside>
    </div>
  );
}

function metaNote(created: { mint: string } | null) {
  if (created) return null;
  return <p className="mt-3 text-[11px] text-[#9DA8BE]">Without PINATA_JWT the metadata URI is this app. Set NEXT_PUBLIC_APP_URL to a public host before a mainnet launch so pump.fun can read it.</p>;
}

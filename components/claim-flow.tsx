"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import type { ClaimEvent, ClaimRecord, Market } from "@/lib/types";
import { platformTreasury } from "@/lib/cluster";
import { explainChainError } from "@/lib/rpc-error";
import { shortKey } from "@/lib/format";

type SessionView = {
  authenticated: boolean;
  login: string | null;
  githubUserId: number | null;
};

export function ClaimFlow({
  markets,
  initialId,
}: {
  markets: Market[];
  initialId?: number;
}) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { setVisible } = useWalletModal();
  const [session, setSession] = useState<SessionView | null>(null);
  const [githubRepoId, setGithubRepoId] = useState(
    initialId
      ? String(initialId)
      : markets[0]
        ? String(markets[0].githubRepoId)
        : "",
  );
  const [claim, setClaim] = useState<ClaimRecord | null>(null);
  const [events, setEvents] = useState<ClaimEvent[]>([]);
  const [market, setMarket] = useState<Market | null>(
    markets.find((item) => item.githubRepoId === initialId) || null,
  );
  const [vaults, setVaults] = useState<
    Array<{ mint: string; total: string; sol: number | null }>
  >([]);
  const [sharingAdmin, setSharingAdmin] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  async function refresh(id = githubRepoId) {
    if (!id) return;
    const response = await fetch(`/api/claim/${id}`);
    const body = await response.json();
    if (!response.ok) {
      setMarket(null);
      setClaim(null);
      setError(body.error || "Market missing.");
      return;
    }
    setMarket(body.market);
    setClaim(body.claim);
    setEvents(body.events || []);
    setError("");
  }

  useEffect(() => {
    fetch("/api/auth/session")
      .then((response) => response.json())
      .then(setSession)
      .catch(() =>
        setError(
          "Could not check your GitHub session. Please refresh and try again.",
        ),
      );
    if (githubRepoId) refresh(githubRepoId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!market) return;
    (async () => {
      try {
        const chain = await import("@/lib/chain");
        const rows = await chain.readVaults(connection, market.launcher);
        setVaults(rows);
        const sharing = await chain.readSharing(connection, market.mint);
        setSharingAdmin(sharing?.admin || null);
      } catch {
        setVaults([]);
      }
    })();
  }, [connection, market]);

  async function verify() {
    if (!wallet.publicKey) return setVisible(true);
    setBusy("Checking GitHub permission…");
    setError("");
    const response = await fetch("/api/claim/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        githubRepoId: Number(githubRepoId),
        wallet: wallet.publicKey.toBase58(),
      }),
    });
    const body = await response.json();
    setBusy("");
    if (!response.ok) {
      setError(body.error || "Verify failed.");
      return;
    }
    setClaim(body.claim);
    await refresh();
  }

  async function bind() {
    if (!wallet.publicKey) return setVisible(true);
    setBusy("Binding wallet…");
    const response = await fetch("/api/claim/complete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        githubRepoId: Number(githubRepoId),
        wallet: wallet.publicKey.toBase58(),
      }),
    });
    const body = await response.json();
    setBusy("");
    if (!response.ok) {
      setError(body.error || "Bind failed.");
      return;
    }
    setClaim(body.claim);
    await refresh();
  }

  async function reassign() {
    if (!wallet.publicKey || !wallet.signTransaction || !market || !claim)
      return;
    if (!platformTreasury) {
      setError("Set NEXT_PUBLIC_PLATFORM_TREASURY before updating shares.");
      return;
    }
    setBusy("Updating fee shares…");
    try {
      const { assignBuilderShare } = await import("@/lib/chain");
      await assignBuilderShare(
        connection,
        {
          publicKey: wallet.publicKey,
          signTransaction: wallet.signTransaction,
        },
        {
          mint: market.mint,
          builder: claim.solanaPubkey,
          launcher: market.launcher,
          treasury: platformTreasury,
        },
      );
      setBusy("");
    } catch (cause) {
      setBusy("");
      setError(explainChainError(cause, "Share update failed."));
    }
  }

  if (markets.length === 0 && !initialId) {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="eyebrow">FOR THE PEOPLE BEHIND THE CODE</p>
        <h1 className="mt-4 font-display text-6xl text-[#F1F2FF]">
          You build. You belong.
        </h1>
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-ff-muted">
          Verify that you own or administer a repository to claim its builder
          share of creator fees.
        </p>
        <div className="empty-state mt-8">
          <span className="empty-icon">
            <ShieldCheck size={23} aria-hidden="true" />
          </span>
          <h2 className="text-lg text-white">A market is the first step.</h2>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-ff-muted">
            There are no launched repos to claim yet. Once your repo has a
            market, come back to verify with GitHub and link your wallet.
          </p>
          <Link href="/launch" className="button-primary mt-6">
            Launch a repo
            <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
          <Link href="/docs#fees" className="button-text mt-3 text-xs">
            How builder fees work
            <ArrowUpRight size={13} aria-hidden="true" />
          </Link>
        </div>
        <p className="mt-5 text-xs leading-relaxed text-ff-muted">
          Proposed split: 70% verified admin, 15% launcher, 15% platform. Claims
          require GitHub owner or admin permission.
        </p>
      </div>
    );
  }

  const status = claim?.status || "unclaimed";

  return (
    <div className="mx-auto max-w-5xl">
      <p className="font-mono text-xs text-[#9CB7FF]">04 Builders earn</p>
      <h1 className="mt-2 font-display text-6xl tracking-tight text-white">
        Builders earn
      </h1>
      <p className="mt-3 max-w-xl text-[#EDF0FF]">
        Prove GitHub adminship. Collect creator fees.
      </p>
      <p className="mt-2 text-xs text-[#9DA8BE]">
        A claim links this GitHub login to a Solana wallet in public. It is
        proof of control at verification time, not a title search. Contested
        claims:{" "}
        <a className="underline" href="/legal#claims">
          Legal
        </a>
        .
      </p>
      <div className="mt-8 grid gap-3 md:grid-cols-5">
        <Step
          n="1"
          title="Wallet"
          ok={wallet.connected}
          body={
            wallet.publicKey
              ? shortKey(wallet.publicKey.toBase58())
              : "Not connected"
          }
          action={
            <button
              type="button"
              className="text-xs underline"
              onClick={() => setVisible(true)}
            >
              Connect
            </button>
          }
        />
        <Step
          n="2"
          title="GitHub"
          ok={Boolean(session?.authenticated)}
          body={session?.login ? `@${session.login}` : "Signed out"}
          action={
            <a className="text-xs underline" href={`/api/auth/github`}>
              Sign in
            </a>
          }
        />
        <Step
          n="3"
          title="Repo"
          ok={Boolean(market)}
          body={market ? market.fullName : "Pick a market"}
          action={null}
        />
        <Step
          n="4"
          title="Permission"
          ok={status === "pending" || status === "active"}
          body={claim?.permission || "Not checked"}
          action={
            <button
              type="button"
              className="text-xs underline"
              onClick={verify}
            >
              Check admin
            </button>
          }
        />
        <Step
          n="5"
          title="Bind"
          ok={status === "active"}
          body={status}
          action={
            <button type="button" className="text-xs underline" onClick={bind}>
              Bind wallet
            </button>
          }
        />
      </div>
      <label
        htmlFor="claim-repo-id"
        className="mt-6 block text-xs text-[#9DA8BE]"
      >
        GitHub repository ID
      </label>
      <div className="mt-1 flex gap-2">
        <input
          id="claim-repo-id"
          inputMode="numeric"
          placeholder="Enter a repository ID"
          value={githubRepoId}
          onChange={(event) => setGithubRepoId(event.target.value)}
          className="w-full rounded-full border border-[#9CB7FF]/30 bg-black/40 px-4 py-2 font-mono"
        />
        <button
          type="button"
          className="rounded-full bg-white px-4 text-sm text-[#14120f]"
          onClick={() => refresh()}
        >
          Load
        </button>
      </div>
      {markets.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {markets.slice(0, 8).map((item) => (
            <button
              key={item.githubRepoId}
              type="button"
              className="rounded-full border border-white/10 px-3 py-1 text-xs"
              onClick={() => {
                setGithubRepoId(String(item.githubRepoId));
                refresh(String(item.githubRepoId));
              }}
            >
              {item.fullName}
            </button>
          ))}
        </div>
      )}
      <section className="mt-6 rounded-3xl border border-[#9CB7FF]/40 bg-[#9CB7FF]/5 p-5 shadow-[0_0_40px_rgba(163,248,107,0.08)]">
        <p className="text-sm text-white">
          On-chain creator vault for the launcher. Zeros are chain reads. A
          failed read stays blank.
        </p>
        <ul className="mt-3 space-y-1 font-mono text-xs text-[#C9D5FF]">
          {vaults.length === 0 && <li>No vault rows returned.</li>}
          {vaults.map((row) => (
            <li key={row.mint}>
              {shortKey(row.mint)} ·{" "}
              {row.sol == null ? row.total : `${row.sol} SOL`}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-[#9DA8BE]">
          Sharing-config admin:{" "}
          {sharingAdmin ? shortKey(sharingAdmin) : "none yet"}.
        </p>
        {status === "active" && claim && (
          <button
            type="button"
            className="mt-4 rounded-full bg-[#9CB7FF] px-4 py-2 text-sm font-semibold text-[#0A1020]"
            onClick={reassign}
          >
            Admin wallet: set 70/15/15
          </button>
        )}
        {busy && <p className="mt-3 text-sm text-white">{busy}</p>}
        {error && <p className="mt-3 text-sm text-[#FFB4BA]">{error}</p>}
      </section>
      <section className="mt-4">
        <h2 className="text-sm text-white">Claim history</h2>
        <ul className="mt-2 space-y-2 text-xs text-[#9DA8BE]">
          {events.length === 0 && <li>No verifications stored.</li>}
          {events.map((event) => (
            <li key={event.id}>
              <span className="font-mono text-[#C9D5FF]">
                {event.createdAt}
              </span>{" "}
              · {event.kind} · {event.detail}
            </li>
          ))}
        </ul>
      </section>
      {session?.authenticated && (
        <button
          type="button"
          className="mt-4 text-xs text-[#9DA8BE] underline"
          onClick={async () => {
            await fetch("/api/auth/session", { method: "DELETE" });
            setSession({
              authenticated: false,
              login: null,
              githubUserId: null,
            });
          }}
        >
          Sign out of GitHub
        </button>
      )}
    </div>
  );
}

function Step({
  n,
  title,
  ok,
  body,
  action,
}: {
  n: string;
  title: string;
  ok: boolean;
  body: string;
  action: React.ReactNode;
}) {
  return (
    <article
      className={`rounded-2xl border p-3 ${ok ? "border-[#9CB7FF] bg-[#9CB7FF]/10" : "border-white/10"}`}
    >
      <p className="font-mono text-[10px] text-[#9CB7FF]">{n}</p>
      <p className="text-sm text-white">{title}</p>
      <p className="mt-1 truncate text-xs text-[#9DA8BE]">{body}</p>
      <div className="mt-2">{action}</div>
    </article>
  );
}

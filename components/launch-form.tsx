"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Market, RepoPreview } from "@/lib/types";
import { formatStars } from "@/lib/format";

export function LaunchForm() {
  const router = useRouter();
  const [url, setUrl] = useState("https://github.com/");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ repo: RepoPreview; market: Market | null } | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("loading");
    setError("");
    setResult(null);
    const response = await fetch(`/api/github/repo?url=${encodeURIComponent(url)}`);
    const body = await response.json();
    if (!response.ok) {
      setStatus("error");
      setError(body.error || "Lookup failed.");
      return;
    }
    setResult(body);
    setStatus("idle");
  }

  return (
    <div className="mx-auto max-w-3xl">
      <p className="font-mono text-xs text-[#39FF14]">02 Launch</p>
      <h1 className="mt-2 font-display text-5xl tracking-tight text-white">Paste a public repo.</h1>
      <p className="mt-3 max-w-xl text-[#7A9A88]">GitFuel fetches the numeric GitHub id and refuses a second market for that id. Private repos stay closed.</p>
      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row">
        <input value={url} onChange={(event) => setUrl(event.target.value)} className="flex-1 rounded-full border border-[#1C2A22] bg-[#0C1210] px-5 py-3 font-mono text-sm outline-none" aria-label="GitHub repository URL" />
        <button className="rounded-full bg-[#39FF14] px-5 py-3 text-sm font-semibold text-[#071208]" type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Fetching repo…" : "Fetch repo"}
        </button>
      </form>
      {error && <p className="mt-4 rounded-2xl border border-[#FF3B4A]/40 bg-[#FF3B4A]/10 px-4 py-3 text-sm text-[#ffd0d4]">{error}</p>}
      {result && (
        <section className="mt-6 rounded-3xl border border-[#1C2A22] bg-[#0C1210] p-5">
          <div className="flex gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={result.repo.avatarUrl} alt="" className="h-14 w-14 rounded-full" />
            <div>
              <h2 className="text-xl text-white">{result.repo.fullName}</h2>
              <p className="mt-1 text-sm text-[#7A9A88]">{result.repo.description || "No description."}</p>
              <p className="mt-2 font-mono text-xs text-[#B2FFC8]">
                id {result.repo.githubRepoId} · {formatStars(result.repo.stars)} stars · {result.repo.forks} forks · {result.repo.language || "—"} · {result.repo.owner}
              </p>
            </div>
          </div>
          {result.market ? (
            <div className="mt-5">
              <p className="text-sm text-white">This repo already has a market.</p>
              <a className="mt-3 inline-flex rounded-full bg-white px-4 py-2 text-sm font-medium text-[#14120f]" href={`/market/${result.market.mint}`}>
                Open {result.market.symbol}
              </a>
            </div>
          ) : (
            <button type="button" className="mt-5 rounded-full bg-[#39FF14] px-4 py-2 text-sm font-semibold text-[#071208]" onClick={() => router.push(`/launch/preview?repo=${result.repo.githubRepoId}`)}>
              Continue to launch preview
            </button>
          )}
        </section>
      )}
    </div>
  );
}

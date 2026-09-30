"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  GitBranch,
  LoaderCircle,
  ShieldCheck,
  Star,
} from "lucide-react";
import type { Market, RepoPreview } from "@/lib/types";
import { formatStars } from "@/lib/format";

export function LaunchForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    repo: RepoPreview;
    market: Market | null;
  } | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("loading");
    setError("");
    setResult(null);
    try {
      const response = await fetch(
        `/api/github/repo?url=${encodeURIComponent(url.trim())}`,
      );
      const body = await response.json().catch(() => {
        throw new Error(
          "The repository service is temporarily unavailable. Please try again.",
        );
      });
      if (!response.ok)
        throw new Error(
          body.error ||
            "We couldn’t find that repository. Check the URL and try again.",
        );
      setResult(body);
      setStatus("idle");
    } catch (cause) {
      setStatus("error");
      setError(
        cause instanceof Error
          ? cause.message
          : "Couldn’t reach GitHub. Please try again.",
      );
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <p className="eyebrow">
        <span className="status-dot" /> YOUR NEXT CHAPTER STARTS HERE
      </p>
      <h1 className="mt-5 font-display text-5xl tracking-tight text-[#F1F2FF] sm:text-6xl">
        Good code deserves fuel.
      </h1>
      <p className="mt-4 max-w-lg text-sm leading-relaxed text-ff-muted">
        Start with a public GitHub repository. We’ll bring in the details, then
        you can make the market your own.
      </p>
      <div className="mt-8 rounded-xl border border-white/10 bg-[#111320] p-5 sm:p-7">
        <form onSubmit={onSubmit} aria-busy={status === "loading"}>
          <label
            htmlFor="repo-url"
            className="mb-3 block text-xs font-medium text-[#d7dfcf]"
          >
            GitHub repository URL
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="search-field min-w-0 flex-1">
              <GitBranch size={16} aria-hidden="true" />
              <input
                id="repo-url"
                type="url"
                required
                value={url}
                onChange={(event) => {
                  setUrl(event.target.value);
                  setResult(null);
                  setError("");
                }}
                placeholder="https://github.com/owner/repository"
                disabled={status === "loading"}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "repo-help repo-error" : "repo-help"}
                className="field"
              />
            </div>
            <button
              className="button-primary"
              type="submit"
              disabled={status === "loading" || !url.trim()}
            >
              {status === "loading" ? (
                <>
                  <LoaderCircle
                    size={15}
                    className="animate-spin"
                    aria-hidden="true"
                  />
                  Finding repo…
                </>
              ) : (
                <>
                  Find repository <ArrowRight size={15} aria-hidden="true" />
                </>
              )}
            </button>
          </div>
          <p
            id="repo-help"
            className="mt-3 text-[11px] leading-relaxed text-ff-muted"
          >
            Public repositories only. No wallet needed to preview.
          </p>
        </form>
        {error && (
          <p
            id="repo-error"
            role="alert"
            className="mt-4 rounded-lg border border-red-400/25 bg-red-400/5 px-4 py-3 text-sm text-red-200"
          >
            {error}
          </p>
        )}
      </div>
      {result && (
        <section
          aria-live="polite"
          className="mt-5 rounded-xl border border-ff-neon/25 bg-[#111320] p-6"
        >
          <p className="eyebrow mb-5 text-ff-mint">REPOSITORY FOUND</p>
          <div className="flex items-start gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={result.repo.avatarUrl}
              alt=""
              className="h-12 w-12 rounded-xl"
            />
            <div className="min-w-0">
              <h2 className="break-words text-lg text-white">
                {result.repo.fullName}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ff-muted">
                {result.repo.description || "No description provided."}
              </p>
              <p className="mt-3 flex flex-wrap items-center gap-2 font-mono text-[10px] text-ff-mint">
                <Star size={12} aria-hidden="true" />
                {formatStars(result.repo.stars)} stars · {result.repo.forks}{" "}
                forks · {result.repo.language || "No language"}
              </p>
            </div>
          </div>
          <div className="mt-6 border-t border-white/10 pt-5">
            {result.market ? (
              <>
                <p className="mb-3 text-sm text-ff-muted">
                  This repo already has a market. You can explore it below.
                </p>
                <Link
                  className="button-primary"
                  href={`/market/${result.market.mint}`}
                >
                  Open {result.market.symbol}
                  <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </>
            ) : (
              <button
                type="button"
                className="button-primary"
                onClick={() =>
                  router.push(
                    `/launch/preview?repo=${result.repo.githubRepoId}`,
                  )
                }
              >
                Customize your launch
                <ArrowRight size={15} aria-hidden="true" />
              </button>
            )}
          </div>
        </section>
      )}
      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="flex gap-3">
          <GitBranch
            size={18}
            className="mt-0.5 shrink-0 text-ff-mint"
            aria-hidden="true"
          />
          <div>
            <h2 className="text-xs font-medium text-white">
              One repo, one market
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-ff-muted">
              Your market is linked to the repository’s permanent GitHub ID.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <ShieldCheck
            size={18}
            className="mt-0.5 shrink-0 text-ff-mint"
            aria-hidden="true"
          />
          <div>
            <h2 className="text-xs font-medium text-white">
              You’re in control
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-ff-muted">
              Review the details before connecting a wallet and signing a
              launch.
            </p>
          </div>
        </div>
      </div>
      <Link href="/docs" className="button-text mt-8 text-xs">
        New to GitFuel? See how it works{" "}
        <ArrowRight size={13} aria-hidden="true" />
      </Link>
    </div>
  );
}

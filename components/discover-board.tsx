"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, ArrowUpRight, Flame, GitBranch, Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import type { Market } from "@/lib/types";
import { RepositoryTable } from "./repository-table";

export function DiscoverBoard({ markets }: { markets: Market[] }) {
  const [q, setQ] = useState("");
  const [language, setLanguage] = useState("");
  const [minStars, setMinStars] = useState("0");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("stars");
  const [showAll, setShowAll] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const languages = useMemo(
    () =>
      [
        ...new Set(markets.map((market) => market.language).filter(Boolean)),
      ].sort() as string[],
    [markets],
  );
  const filtered = Boolean(q.trim() || language || minStars !== "0" || status);
  const visible = markets
    .filter((market) => {
      const query = q.trim().toLowerCase();
      if (
        query &&
        !`${market.fullName} ${market.symbol} ${market.mint} ${market.githubRepoId}`
          .toLowerCase()
          .includes(query)
      )
        return false;
      if (language && market.language !== language) return false;
      if (Number(minStars) && market.stars < Number(minStars)) return false;
      if (status === "claimed" && market.claimStatus !== "active") return false;
      if (status === "unclaimed" && market.claimStatus === "active")
        return false;
      if (status === "bonding" && market.bondingComplete) return false;
      if (status === "graduated" && !market.bondingComplete) return false;
      return true;
    })
    .sort((a, b) =>
      sort === "stars"
        ? b.stars - a.stars || Date.parse(b.createdAt) - Date.parse(a.createdAt)
        : sort === "name"
          ? a.fullName.localeCompare(b.fullName)
          : Date.parse(b.createdAt) - Date.parse(a.createdAt),
    );

  function resetFilters() {
    setQ("");
    setLanguage("");
    setMinStars("0");
    setStatus("");
  }

  return (
    <section
      id="markets"
      className="market-section"
      aria-labelledby="markets-title"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-3">DISCOVER WHAT’S NEXT</p>
          <h2 id="markets-title" className="section-title">
            Explore repositories.
          </h2>
          <p className="mt-3 text-sm text-ff-muted">Find your next project. Fuel the people building it.</p>
        </div>
        <button type="button" className="explore-view-all" onClick={() => setShowAll(!showAll)} aria-expanded={showAll} aria-controls="repository-results">
          {showAll ? "Show top five" : "View all repositories"} <ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>
      <div className="explore-toolbar">
        <div className="explore-sort-group" role="group" aria-label="Repository ranking">
          <button type="button" aria-pressed={sort === "stars"} onClick={() => setSort("stars")}><Flame size={15} aria-hidden="true" />Trending</button>
          <button type="button" aria-pressed={sort === "newest"} onClick={() => setSort("newest")}><Sparkles size={15} aria-hidden="true" />New</button>
        </div>
        <p className="explore-ranking">{sort === "stars" ? "Ranked by GitHub stars" : sort === "newest" ? "Latest launches first" : "Sorted by repository name"}</p>
        <button type="button" className="explore-filter-toggle" aria-expanded={showFilters} aria-controls="repository-filters" onClick={() => setShowFilters(!showFilters)}>
          <SlidersHorizontal size={14} aria-hidden="true" /> Filters {filtered && <span className="filter-active-dot" aria-label="Active" />}
        </button>
      </div>
      <div
        id="repository-filters"
        className="market-filters"
        role="search"
        aria-label="Filter repository markets"
        hidden={!showFilters}
      >
        <div className="search-field">
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Search repos, tokens, or addresses…"
            aria-label="Search markets"
            className="field [&::-webkit-search-cancel-button]:appearance-none"
          />
          {q && (
            <button
              type="button"
              className="clear-search"
              aria-label="Clear search"
              onClick={() => setQ("")}
            >
              <X size={14} />
            </button>
          )}
        </div>
        <select
          aria-label="Filter by language"
          value={language}
          onChange={(event) => setLanguage(event.target.value)}
          className="field"
        >
          <option value="">All languages</option>
          {languages.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select
          aria-label="Minimum GitHub stars"
          value={minStars}
          onChange={(event) => setMinStars(event.target.value)}
          className="field"
        >
          <option value="0">Any stars</option>
          <option value="10">10+ stars</option>
          <option value="100">100+ stars</option>
          <option value="1000">1k+ stars</option>
        </select>
        <select
          aria-label="Market status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="field"
        >
          <option value="">All markets</option>
          <option value="unclaimed">Unclaimed builder</option>
          <option value="claimed">Claimed builder</option>
          <option value="bonding">Bonding</option>
          <option value="graduated">Graduated</option>
        </select>
        <select
          aria-label="Sort markets"
          value={sort}
          onChange={(event) => setSort(event.target.value)}
          className="field market-sort"
        >
          <option value="newest">Newest first</option>
          <option value="stars">Most stars</option>
          <option value="name">Name A–Z</option>
        </select>
      </div>
      <div className="mb-4 flex min-h-6 items-center justify-between text-[11px] text-ff-muted">
        <p role="status">
          {showAll ? visible.length : Math.min(5, visible.length)} of {visible.length} {visible.length === 1 ? "repository" : "repositories"}
          {filtered ? ` · filtered from ${markets.length}` : ""}
        </p>
        {filtered && (
          <button
            type="button"
            onClick={resetFilters}
            className="flex min-h-8 items-center gap-1 text-ff-mint hover:text-white"
          >
            <X size={12} aria-hidden="true" />
            Reset filters
          </button>
        )}
      </div>
      <div id="repository-results">
      <RepositoryTable markets={showAll ? visible : visible.slice(0, 5)} emptyContent={markets.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">
            <GitBranch size={22} aria-hidden="true" />
          </span>
          <h3 className="text-lg font-medium text-white">
            Every great market starts with a commit.
          </h3>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-ff-muted">
            No repos have launched here yet. Bring a project you believe in and
            be the first to fuel it.
          </p>
          <Link href="/launch" className="button-primary mt-6">
            Launch the first repo <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
          <p className="mt-5 font-mono text-[9px] tracking-wide text-white/35">
            ONE PUBLIC REPO. ONE MARKET. YOUR CALL.
          </p>
        </div>
      ) : visible.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">
            <Search size={22} aria-hidden="true" />
          </span>
          <h3 className="text-lg text-white">No matching markets</h3>
          <p className="mt-2 text-sm text-ff-muted">
            Try a different repo name or broaden your filters.
          </p>
          <button
            type="button"
            className="button-secondary mt-5"
            onClick={resetFilters}
          >
            Clear all filters
          </button>
        </div>
      ) : null} />
      </div>
      <p className="mt-5 flex items-center justify-center gap-2 text-center text-[10px] text-ff-muted">
        <GitBranch size={12} className="shrink-0" aria-hidden="true" />
        Each market follows its GitHub repo, even when the name changes.
      </p>
    </section>
  );
}

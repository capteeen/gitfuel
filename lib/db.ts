import fs from "fs";
import path from "path";
import { DatabaseSync } from "node:sqlite";
import type { ClaimEvent, ClaimRecord, ClaimStatus, Market, RepoPreview } from "./types";

let db: DatabaseSync | null = null;

function database() {
  if (db) return db;
  const dir = path.join(process.cwd(), "data");
  fs.mkdirSync(dir, { recursive: true });
  db = new DatabaseSync(path.join(dir, "gitfuel.sqlite"));
  db.exec(`
    CREATE TABLE IF NOT EXISTS repos (
      github_repo_id INTEGER PRIMARY KEY,
      owner TEXT NOT NULL,
      name TEXT NOT NULL,
      full_name TEXT NOT NULL,
      description TEXT,
      stars INTEGER NOT NULL,
      forks INTEGER NOT NULL,
      language TEXT,
      avatar_url TEXT NOT NULL,
      html_url TEXT NOT NULL,
      fetched_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS markets (
      github_repo_id INTEGER PRIMARY KEY,
      owner TEXT NOT NULL,
      name TEXT NOT NULL,
      full_name TEXT NOT NULL,
      description TEXT,
      stars INTEGER NOT NULL,
      forks INTEGER NOT NULL,
      language TEXT,
      avatar_url TEXT NOT NULL,
      html_url TEXT NOT NULL,
      coin_name TEXT NOT NULL,
      symbol TEXT NOT NULL,
      mint TEXT NOT NULL UNIQUE,
      metadata_uri TEXT NOT NULL,
      image_url TEXT,
      launcher TEXT NOT NULL,
      bonding_complete INTEGER NOT NULL DEFAULT 0,
      pumpswap_pool TEXT,
      confirmed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS claims (
      github_repo_id INTEGER PRIMARY KEY,
      github_user_id INTEGER NOT NULL,
      github_login TEXT NOT NULL,
      solana_pubkey TEXT NOT NULL,
      status TEXT NOT NULL,
      permission TEXT,
      verified_at TEXT
    );
    CREATE TABLE IF NOT EXISTS claim_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      github_repo_id INTEGER NOT NULL,
      kind TEXT NOT NULL,
      detail TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS metadata (
      github_repo_id INTEGER PRIMARY KEY,
      body TEXT NOT NULL
    );
  `);
  return db;
}

function num(value: unknown) {
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "number") return value;
  if (typeof value === "string" && value) return Number(value);
  return 0;
}

function text(value: unknown) {
  return value == null ? "" : String(value);
}

function nullable(value: unknown) {
  if (value == null || value === "") return null;
  return String(value);
}

function row(value: unknown) {
  return (value ?? {}) as Record<string, unknown>;
}

function toRepo(value: unknown): RepoPreview {
  const record = row(value);
  return {
    githubRepoId: num(record.github_repo_id),
    owner: text(record.owner),
    name: text(record.name),
    fullName: text(record.full_name),
    description: nullable(record.description),
    stars: num(record.stars),
    forks: num(record.forks),
    language: nullable(record.language),
    avatarUrl: text(record.avatar_url),
    htmlUrl: text(record.html_url),
  };
}

function toMarket(value: unknown): Market {
  const record = row(value);
  const status = text(record.claim_status);
  const claimStatus: ClaimStatus =
    status === "pending" || status === "active" || status === "revoked" ? status : "unclaimed";
  return {
    ...toRepo(record),
    coinName: text(record.coin_name),
    symbol: text(record.symbol),
    mint: text(record.mint),
    metadataUri: text(record.metadata_uri),
    imageUrl: nullable(record.image_url),
    launcher: text(record.launcher),
    bondingComplete: num(record.bonding_complete) === 1,
    pumpswapPool: nullable(record.pumpswap_pool),
    confirmed: num(record.confirmed) === 1,
    createdAt: text(record.created_at),
    claimStatus,
    claimedWallet: nullable(record.claimed_wallet),
    claimedByGithubUserId: record.claimed_by == null ? null : num(record.claimed_by),
  };
}

const MARKET_SELECT = `
  SELECT m.*, c.status AS claim_status, c.solana_pubkey AS claimed_wallet, c.github_user_id AS claimed_by
  FROM markets m
  LEFT JOIN claims c ON c.github_repo_id = m.github_repo_id
`;

export function upsertRepo(repo: RepoPreview) {
  database()
    .prepare(
      `INSERT INTO repos (
        github_repo_id, owner, name, full_name, description, stars, forks, language, avatar_url, html_url, fetched_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(github_repo_id) DO UPDATE SET
        owner = excluded.owner,
        name = excluded.name,
        full_name = excluded.full_name,
        description = excluded.description,
        stars = excluded.stars,
        forks = excluded.forks,
        language = excluded.language,
        avatar_url = excluded.avatar_url,
        html_url = excluded.html_url,
        fetched_at = excluded.fetched_at`,
    )
    .run(
      repo.githubRepoId,
      repo.owner,
      repo.name,
      repo.fullName,
      repo.description,
      repo.stars,
      repo.forks,
      repo.language,
      repo.avatarUrl,
      repo.htmlUrl,
      new Date().toISOString(),
    );
}

export function getRepo(githubRepoId: number) {
  const found = database().prepare("SELECT * FROM repos WHERE github_repo_id = ?").get(githubRepoId);
  return found ? toRepo(found) : null;
}

export function getMarketByGithubId(githubRepoId: number) {
  const found = database().prepare(`${MARKET_SELECT} WHERE m.github_repo_id = ?`).get(githubRepoId);
  return found ? toMarket(found) : null;
}

export function getMarketByMint(mint: string) {
  const found = database().prepare(`${MARKET_SELECT} WHERE m.mint = ?`).get(mint);
  return found ? toMarket(found) : null;
}

export function listMarkets(filters: {
  q?: string;
  language?: string;
  minStars?: number;
  claim?: string;
  stage?: string;
} = {}) {
  const clauses: string[] = [];
  const params: Array<string | number> = [];
  if (filters.q) {
    clauses.push("(m.full_name LIKE ? OR m.symbol LIKE ? OR m.mint LIKE ? OR CAST(m.github_repo_id AS TEXT) LIKE ?)");
    const like = `%${filters.q}%`;
    params.push(like, like, like, like);
  }
  if (filters.language) {
    clauses.push("m.language = ?");
    params.push(filters.language);
  }
  if (filters.minStars) {
    clauses.push("m.stars >= ?");
    params.push(filters.minStars);
  }
  if (filters.claim === "claimed") clauses.push("c.status = 'active'");
  if (filters.claim === "unclaimed") clauses.push("(c.status IS NULL OR c.status != 'active')");
  if (filters.stage === "bonding") clauses.push("m.bonding_complete = 0");
  if (filters.stage === "graduated") clauses.push("m.bonding_complete = 1");
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  return database()
    .prepare(`${MARKET_SELECT} ${where} ORDER BY m.created_at DESC`)
    .all(...params)
    .map(toMarket);
}

export function listLanguages() {
  return database()
    .prepare("SELECT DISTINCT language FROM markets WHERE language IS NOT NULL AND language != '' ORDER BY language")
    .all()
    .map((item) => text(row(item).language))
    .filter(Boolean);
}

export function insertMarket(input: {
  repo: RepoPreview;
  coinName: string;
  symbol: string;
  mint: string;
  metadataUri: string;
  imageUrl: string | null;
  launcher: string;
}) {
  const existing = getMarketByGithubId(input.repo.githubRepoId);
  if (existing) {
    const error = new Error("This GitHub repo id already has a market.");
    (error as Error & { market?: Market }).market = existing;
    throw error;
  }
  database()
    .prepare(
      `INSERT INTO markets (
        github_repo_id, owner, name, full_name, description, stars, forks, language, avatar_url, html_url,
        coin_name, symbol, mint, metadata_uri, image_url, launcher, bonding_complete, pumpswap_pool, confirmed, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, 1, ?)`,
    )
    .run(
      input.repo.githubRepoId,
      input.repo.owner,
      input.repo.name,
      input.repo.fullName,
      input.repo.description,
      input.repo.stars,
      input.repo.forks,
      input.repo.language,
      input.repo.avatarUrl,
      input.repo.htmlUrl,
      input.coinName,
      input.symbol,
      input.mint,
      input.metadataUri,
      input.imageUrl,
      input.launcher,
      new Date().toISOString(),
    );
  return getMarketByMint(input.mint);
}

export function updateCurve(mint: string, bondingComplete: boolean, pumpswapPool: string | null) {
  database()
    .prepare("UPDATE markets SET bonding_complete = ?, pumpswap_pool = ? WHERE mint = ?")
    .run(bondingComplete ? 1 : 0, pumpswapPool, mint);
  return getMarketByMint(mint);
}

export function saveMetadata(githubRepoId: number, body: string) {
  database()
    .prepare(
      `INSERT INTO metadata (github_repo_id, body) VALUES (?, ?)
       ON CONFLICT(github_repo_id) DO UPDATE SET body = excluded.body`,
    )
    .run(githubRepoId, body);
}

export function readMetadata(githubRepoId: number) {
  const found = database().prepare("SELECT body FROM metadata WHERE github_repo_id = ?").get(githubRepoId);
  return found ? text(row(found).body) : null;
}

export function getClaim(githubRepoId: number): ClaimRecord | null {
  const found = database().prepare("SELECT * FROM claims WHERE github_repo_id = ?").get(githubRepoId);
  if (!found) return null;
  const record = row(found);
  const status = text(record.status);
  if (status !== "pending" && status !== "active" && status !== "revoked") return null;
  return {
    githubRepoId: num(record.github_repo_id),
    githubUserId: num(record.github_user_id),
    githubLogin: text(record.github_login),
    solanaPubkey: text(record.solana_pubkey),
    status,
    permission: nullable(record.permission),
    verifiedAt: nullable(record.verified_at),
  };
}

export function saveClaim(claim: ClaimRecord) {
  database()
    .prepare(
      `INSERT INTO claims (
        github_repo_id, github_user_id, github_login, solana_pubkey, status, permission, verified_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(github_repo_id) DO UPDATE SET
        github_user_id = excluded.github_user_id,
        github_login = excluded.github_login,
        solana_pubkey = excluded.solana_pubkey,
        status = excluded.status,
        permission = excluded.permission,
        verified_at = excluded.verified_at`,
    )
    .run(
      claim.githubRepoId,
      claim.githubUserId,
      claim.githubLogin,
      claim.solanaPubkey,
      claim.status,
      claim.permission,
      claim.verifiedAt,
    );
}

export function addClaimEvent(githubRepoId: number, kind: string, detail: string) {
  database()
    .prepare("INSERT INTO claim_events (github_repo_id, kind, detail, created_at) VALUES (?, ?, ?, ?)")
    .run(githubRepoId, kind, detail, new Date().toISOString());
}

export function listClaimEvents(githubRepoId: number): ClaimEvent[] {
  return database()
    .prepare("SELECT * FROM claim_events WHERE github_repo_id = ? ORDER BY id DESC LIMIT 20")
    .all(githubRepoId)
    .map((item) => {
      const record = row(item);
      return {
        id: num(record.id),
        githubRepoId: num(record.github_repo_id),
        kind: text(record.kind),
        detail: text(record.detail),
        createdAt: text(record.created_at),
      };
    });
}

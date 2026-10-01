import fs from "fs";
import path from "path";
import type { DatabaseSync } from "node:sqlite";
import type { Client } from "@libsql/client/web";
import { createSupabaseClient, supabaseConfigured } from "./supabase";
import type { ClaimEvent, ClaimRecord, ClaimStatus, Market, RepoPreview } from "./types";

let db: Promise<DatabaseSync> | null = null;
let remote: Promise<Client> | null = null;
type SqlValue = string | number | null;

const schema = `
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
  `;

export function storageConfigured() {
  return !process.env.VERCEL || Boolean(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN);
}

export type LaunchRegistry =
  | { state: "open" }
  | { state: "missing_table" }
  | { state: "unavailable"; detail?: string };

function missingMarketsTable(error: { code?: string; message?: string }) {
  const code = error.code || "";
  const message = error.message || "";
  return (
    code === "PGRST205" ||
    code === "42P01" ||
    /could not find the table ['"]public\.markets['"]/i.test(message) ||
    /relation ['"]public\.markets['"] does not exist/i.test(message)
  );
}

/** Supabase public.markets is the launch registry when it answers. Turso is only required for the SQLite cache and claims. */
export async function launchRegistry(): Promise<LaunchRegistry> {
  if (supabaseConfigured()) {
    try {
      const supabase = createSupabaseClient();
      const { error } = await supabase.from("markets").select("github_repo_id").limit(1);
      if (!error) return { state: "open" };
      if (missingMarketsTable(error)) return { state: "missing_table" };
      console.warn(`Markets registry query failed: ${error.message}`);
      return { state: "unavailable", detail: "Supabase is configured, but the markets registry could not be queried. Refresh and try again." };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Supabase query failed.";
      console.warn(`Markets registry query failed: ${message}`);
      return { state: "unavailable", detail: "Supabase is configured, but the markets registry could not be queried. Refresh and try again." };
    }
  }
  if (storageConfigured()) return { state: "open" };
  return { state: "unavailable" };
}

export async function launchRegistryBlock() {
  const registry = await launchRegistry();
  if (registry.state === "open") return null;
  if (registry.state === "missing_table") {
    return "The public.markets table is missing. Apply supabase/migrations/20260930120000_markets.sql.";
  }
  return registry.detail || "Market registry is temporarily unavailable.";
}

function requirePersistentStorage() {
  if (!storageConfigured()) {
    throw new Error("Market registry unavailable: configure TURSO_DATABASE_URL and TURSO_AUTH_TOKEN before launching or claiming.");
  }
}

async function database() {
  if (db) return db;
  db = (async () => {
    const { DatabaseSync } = await import("node:sqlite");
    const dir = path.join(process.cwd(), "data");
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, "repogo.sqlite");
    const previous = path.join(dir, "gitfuel.sqlite");
    if (!fs.existsSync(file) && fs.existsSync(previous)) fs.renameSync(previous, file);
    const local = new DatabaseSync(file);
    local.exec(schema);
    return local;
  })();
  return db;
}

async function remoteDatabase() {
  if (!remote) {
    remote = (async () => {
      const { createClient } = await import("@libsql/client/web");
      const client = createClient({
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN!,
      });
      await client.batch(schema.split(";").map((sql) => sql.trim()).filter(Boolean), "write");
      return client;
    })();
  }
  return remote;
}

async function all(sql: string, args: SqlValue[] = []): Promise<unknown[]> {
  if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
    return (await (await remoteDatabase()).execute({ sql, args })).rows;
  }
  if (process.env.VERCEL) return [];
  return (await database()).prepare(sql).all(...args);
}

async function run(sql: string, args: SqlValue[] = []) {
  requirePersistentStorage();
  if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
    await (await remoteDatabase()).execute({ sql, args });
  } else {
    (await database()).prepare(sql).run(...args);
  }
}

function num(value: unknown) {
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "number") return value;
  if (typeof value === "string" && value) return Number(value);
  return 0;
}

function flag(value: unknown) {
  return value === true || num(value) === 1;
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
    bondingComplete: flag(record.bonding_complete),
    pumpswapPool: nullable(record.pumpswap_pool),
    confirmed: flag(record.confirmed),
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

export async function upsertRepo(repo: RepoPreview) {
  if (!storageConfigured()) return;
  await run(
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
    [
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
    ],
  );
}

export async function getRepo(githubRepoId: number) {
  const [found] = await all("SELECT * FROM repos WHERE github_repo_id = ?", [githubRepoId]);
  return found ? toRepo(found) : null;
}

type MarketFilters = {
  q?: string;
  language?: string;
  minStars?: number;
  claim?: string;
  stage?: string;
};

function applyClaim(market: Market, claim: unknown): Market {
  if (!claim) return market;
  const record = row(claim);
  const status = text(record.status);
  const claimStatus: ClaimStatus =
    status === "pending" || status === "active" || status === "revoked" ? status : "unclaimed";
  return {
    ...market,
    claimStatus,
    claimedWallet: nullable(record.solana_pubkey),
    claimedByGithubUserId: record.github_user_id == null ? null : num(record.github_user_id),
  };
}

async function overlayClaims(markets: Market[]) {
  if (!markets.length) return markets;
  try {
    const ids = markets.map((market) => market.githubRepoId);
    const placeholders = ids.map(() => "?").join(", ");
    const claims = await all(
      `SELECT github_repo_id, status, solana_pubkey, github_user_id FROM claims WHERE github_repo_id IN (${placeholders})`,
      ids,
    );
    const byId = new Map(claims.map((item) => [num(row(item).github_repo_id), item]));
    return markets.map((market) => applyClaim(market, byId.get(market.githubRepoId)));
  } catch (error) {
    console.warn(error instanceof Error ? `Claim overlay failed: ${error.message}` : "Claim overlay failed");
    return markets;
  }
}

function matchesFilters(market: Market, filters: MarketFilters) {
  if (filters.q) {
    const query = filters.q.toLowerCase();
    const haystack = `${market.fullName} ${market.symbol} ${market.mint} ${market.githubRepoId}`.toLowerCase();
    if (!haystack.includes(query)) return false;
  }
  if (filters.language && market.language !== filters.language) return false;
  if (filters.minStars && market.stars < filters.minStars) return false;
  if (filters.claim === "claimed" && market.claimStatus !== "active") return false;
  if (filters.claim === "unclaimed" && market.claimStatus === "active") return false;
  if (filters.stage === "bonding" && market.bondingComplete) return false;
  if (filters.stage === "graduated" && !market.bondingComplete) return false;
  return true;
}

function isMetadataDraft(value: unknown) {
  return text(row(value).status) === "test";
}

async function supabaseMarkets() {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase.from("markets").select("*").neq("status", "test").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return overlayClaims((data ?? []).map((item) => toMarket(item)));
}

async function queryMarkets(filters: MarketFilters = {}) {
  if (supabaseConfigured()) {
    return (await supabaseMarkets()).filter((market) => matchesFilters(market, filters));
  }
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
  return (await all(`${MARKET_SELECT} ${where} ORDER BY m.created_at DESC`, params)).map(toMarket);
}

export async function listDisplayedMarkets() {
  try {
    return { markets: await queryMarkets(), error: null as string | null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    console.warn(message ? `Market list failed: ${message}` : "Market list failed");
    const missing = /PGRST205|42P01|could not find the table ['"]public\.markets['"]|relation ['"]public\.markets['"] does not exist/i.test(message);
    return {
      markets: [] as Market[],
      error: missing
        ? "The public.markets table is missing. Apply supabase/migrations/20260930120000_markets.sql, then refresh."
        : "Launches could not be loaded right now.",
    };
  }
}

export async function getMarketByGithubId(githubRepoId: number) {
  if (supabaseConfigured()) {
    try {
      const supabase = createSupabaseClient();
      const { data, error } = await supabase.from("markets").select("*").eq("github_repo_id", githubRepoId).maybeSingle();
      if (error) throw new Error(error.message);
      if (!data || isMetadataDraft(data)) return null;
      const [market] = await overlayClaims([toMarket(data)]);
      return market ?? null;
    } catch (error) {
      console.warn(error instanceof Error ? `Market lookup failed: ${error.message}` : "Market lookup failed");
      return null;
    }
  }
  const [found] = await all(`${MARKET_SELECT} WHERE m.github_repo_id = ?`, [githubRepoId]);
  return found ? toMarket(found) : null;
}

export async function getMarketByMint(mint: string) {
  if (supabaseConfigured()) {
    try {
      const supabase = createSupabaseClient();
      const { data, error } = await supabase.from("markets").select("*").eq("mint", mint).maybeSingle();
      if (error) throw new Error(error.message);
      if (!data || isMetadataDraft(data)) return null;
      const [market] = await overlayClaims([toMarket(data)]);
      return market ?? null;
    } catch (error) {
      console.warn(error instanceof Error ? `Market lookup failed: ${error.message}` : "Market lookup failed");
      return null;
    }
  }
  const [found] = await all(`${MARKET_SELECT} WHERE m.mint = ?`, [mint]);
  return found ? toMarket(found) : null;
}

export async function listMarkets(filters: MarketFilters = {}) {
  try {
    return await queryMarkets(filters);
  } catch (error) {
    console.warn(error instanceof Error ? `Market list failed: ${error.message}` : "Market list failed");
    return [];
  }
}

export async function listLanguages() {
  try {
    if (supabaseConfigured()) {
      const supabase = createSupabaseClient();
      const { data, error } = await supabase.from("markets").select("language").neq("status", "test");
      if (error) throw new Error(error.message);
      const languages = (data ?? [])
        .map((item) => nullable(row(item).language))
        .filter((language): language is string => Boolean(language));
      return [...new Set(languages)].sort();
    }
    return (await all("SELECT DISTINCT language FROM markets WHERE language IS NOT NULL AND language != '' ORDER BY language"))
      .map((item) => text(row(item).language))
      .filter(Boolean);
  } catch (error) {
    console.warn(error instanceof Error ? `Language list failed: ${error.message}` : "Language list failed");
    return [];
  }
}

const MARKET_INSERT = `INSERT INTO markets (
        github_repo_id, owner, name, full_name, description, stars, forks, language, avatar_url, html_url,
        coin_name, symbol, mint, metadata_uri, image_url, launcher, bonding_complete, pumpswap_pool, confirmed, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, 1, ?)`;

function marketInsertArgs(input: {
  repo: RepoPreview;
  coinName: string;
  symbol: string;
  mint: string;
  metadataUri: string;
  imageUrl: string | null;
  launcher: string;
}, createdAt: string): SqlValue[] {
  return [
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
    createdAt,
  ];
}

async function cacheMarketLocally(input: {
  repo: RepoPreview;
  coinName: string;
  symbol: string;
  mint: string;
  metadataUri: string;
  imageUrl: string | null;
  launcher: string;
}, createdAt: string) {
  if (process.env.VERCEL && !(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN)) return;
  try {
    await run(MARKET_INSERT, marketInsertArgs(input, createdAt));
  } catch (error) {
    console.warn(error instanceof Error ? `Local market cache write failed: ${error.message}` : "Local market cache write failed");
  }
}

export async function insertMarket(input: {
  repo: RepoPreview;
  coinName: string;
  symbol: string;
  mint: string;
  metadataUri: string;
  imageUrl: string | null;
  launcher: string;
}) {
  const existing = await getMarketByGithubId(input.repo.githubRepoId);
  if (existing) {
    const error = new Error("This GitHub repo id already has a market.");
    (error as Error & { market?: Market }).market = existing;
    throw error;
  }
  const createdAt = new Date().toISOString();
  if (supabaseConfigured()) {
    const supabase = createSupabaseClient();
    const { data: draft, error: draftError } = await supabase
      .from("markets")
      .select("*")
      .eq("github_repo_id", input.repo.githubRepoId)
      .eq("status", "test")
      .maybeSingle();
    if (draftError) throw new Error(draftError.message);
    if (draft) {
      const { error: deleteError } = await supabase.from("markets").delete().eq("github_repo_id", input.repo.githubRepoId).eq("status", "test");
      if (deleteError) throw new Error(deleteError.message);
    }
    const { error } = await supabase.from("markets").insert({
      github_repo_id: input.repo.githubRepoId,
      owner: input.repo.owner,
      name: input.repo.name,
      full_name: input.repo.fullName,
      description: draft ? (draft.description ?? "") : input.repo.description,
      stars: input.repo.stars,
      forks: input.repo.forks,
      language: input.repo.language,
      avatar_url: input.repo.avatarUrl,
      html_url: input.repo.htmlUrl,
      coin_name: input.coinName,
      symbol: input.symbol,
      mint: input.mint,
      metadata_uri: input.metadataUri,
      image_url: input.imageUrl,
      launcher: input.launcher,
      bonding_complete: false,
      pumpswap_pool: null,
      confirmed: true,
      status: "launched",
      created_at: createdAt,
    });
    if (error) {
      if (draft) await supabase.from("markets").insert(draft);
      if (error.code === "23505") {
        const duplicate = new Error("This GitHub repo id already has a market.");
        throw duplicate;
      }
      throw new Error(error.message);
    }
    await cacheMarketLocally(input, createdAt);
    return await getMarketByMint(input.mint);
  }
  await run(MARKET_INSERT, marketInsertArgs(input, createdAt));
  return await getMarketByMint(input.mint);
}

export async function updateCurve(mint: string, bondingComplete: boolean, pumpswapPool: string | null) {
  if (supabaseConfigured()) {
    const supabase = createSupabaseClient();
    const { error } = await supabase
      .from("markets")
      .update({
        bonding_complete: bondingComplete,
        pumpswap_pool: pumpswapPool,
        status: bondingComplete ? "graduated" : "launched",
      })
      .eq("mint", mint)
      .neq("status", "test");
    if (error) throw new Error(error.message);
  }
  if (!(process.env.VERCEL && !(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN))) {
    try {
      await run("UPDATE markets SET bonding_complete = ?, pumpswap_pool = ? WHERE mint = ?", [bondingComplete ? 1 : 0, pumpswapPool, mint]);
    } catch (error) {
      if (!supabaseConfigured()) throw error;
      console.warn(error instanceof Error ? `Local curve cache update failed: ${error.message}` : "Local curve cache update failed");
    }
  }
  return await getMarketByMint(mint);
}

const METADATA_DRAFT_LAUNCHER = "RepogoMetadataDraftLauncher0001";

function metadataDraftMint(githubRepoId: number) {
  return `repogomd${String(githubRepoId).padStart(24, "0")}`;
}

function metadataDocument(record: Record<string, unknown>) {
  const image = nullable(record.image_url);
  const website = nullable(record.html_url);
  const name = text(record.coin_name);
  const symbol = text(record.symbol);
  if (!name || !symbol || !image || !website) return null;
  return JSON.stringify({
    name,
    symbol,
    description: nullable(record.description) ?? "",
    image,
    showName: true,
    createdOn: "https://repogo.xyz",
    website,
    external_url: website,
    attributes: [{ trait_type: "github_repo_id", value: String(num(record.github_repo_id)) }],
  });
}

async function saveMetadataDraft(repo: RepoPreview, body: string, metadataUri: string) {
  const document = JSON.parse(body) as { name?: string; symbol?: string; description?: string; image?: string };
  if (!document.name || !document.symbol || !document.image) {
    throw new Error("Metadata is incomplete.");
  }
  const supabase = createSupabaseClient();
  const row = {
    github_repo_id: repo.githubRepoId,
    owner: repo.owner,
    name: repo.name,
    full_name: repo.fullName,
    description: document.description ?? "",
    stars: repo.stars,
    forks: repo.forks,
    language: repo.language,
    avatar_url: repo.avatarUrl,
    html_url: repo.htmlUrl,
    coin_name: document.name,
    symbol: document.symbol,
    mint: metadataDraftMint(repo.githubRepoId),
    metadata_uri: metadataUri,
    image_url: document.image,
    launcher: METADATA_DRAFT_LAUNCHER,
    bonding_complete: false,
    pumpswap_pool: null,
    confirmed: true,
    status: "test",
  };
  const { error: deleteError } = await supabase.from("markets").delete().eq("github_repo_id", repo.githubRepoId).eq("status", "test");
  if (deleteError) throw new Error(deleteError.message);
  const { error } = await supabase.from("markets").insert(row);
  if (error?.code === "23505") throw new Error("This GitHub repo id already has a market.");
  if (error) throw new Error(error.message);
}

export async function saveMetadata(repo: RepoPreview, body: string, metadataUri: string) {
  if (supabaseConfigured()) await saveMetadataDraft(repo, body, metadataUri);
  if (!storageConfigured()) return;
  await run(
    `INSERT INTO metadata (github_repo_id, body) VALUES (?, ?)
       ON CONFLICT(github_repo_id) DO UPDATE SET body = excluded.body`,
    [repo.githubRepoId, body],
  );
}

export async function readMetadata(githubRepoId: number) {
  const [found] = await all("SELECT body FROM metadata WHERE github_repo_id = ?", [githubRepoId]);
  if (found) return text(row(found).body);
  if (!supabaseConfigured()) return null;
  const supabase = createSupabaseClient();
  const { data, error } = await supabase.from("markets").select("*").eq("github_repo_id", githubRepoId).maybeSingle();
  if (error || !data) return null;
  return metadataDocument(row(data));
}

export async function getClaim(githubRepoId: number): Promise<ClaimRecord | null> {
  const [found] = await all("SELECT * FROM claims WHERE github_repo_id = ?", [githubRepoId]);
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

export async function saveClaim(claim: ClaimRecord) {
  await run(
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
    [
      claim.githubRepoId,
      claim.githubUserId,
      claim.githubLogin,
      claim.solanaPubkey,
      claim.status,
      claim.permission,
      claim.verifiedAt,
    ],
  );
}

export async function addClaimEvent(githubRepoId: number, kind: string, detail: string) {
  await run("INSERT INTO claim_events (github_repo_id, kind, detail, created_at) VALUES (?, ?, ?, ?)", [githubRepoId, kind, detail, new Date().toISOString()]);
}

export async function listClaimEvents(githubRepoId: number): Promise<ClaimEvent[]> {
  return (await all("SELECT * FROM claim_events WHERE github_repo_id = ? ORDER BY id DESC LIMIT 20", [githubRepoId]))
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

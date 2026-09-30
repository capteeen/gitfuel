import { getMarketByGithubId, upsertRepo } from "./db";
import type { RepoPreview } from "./types";

const OWNER = /^[A-Za-z0-9_.-]+$/;

export function parseGithubUrl(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return { error: "Paste a GitHub URL." as const };
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(withProtocol);
  } catch {
    return { error: "That is not a URL." as const };
  }
  if (url.hostname !== "github.com" && url.hostname !== "www.github.com") {
    return { error: "Use a github.com repository URL." as const };
  }
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length < 2) return { error: "Use https://github.com/{owner}/{repo}." as const };
  if (parts.length > 2) {
    return { error: "Use the repository root, not a file, issue, or branch URL." as const };
  }
  const owner = parts[0];
  const repo = parts[1].replace(/\.git$/, "");
  if (!OWNER.test(owner) || !OWNER.test(repo)) {
    return { error: "Owner or repo contains characters GitFuel will not send to GitHub." as const };
  }
  return { owner, repo };
}

export async function resolvePublicRepo(owner: string, repo: string): Promise<RepoPreview> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "GitFuel",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers, cache: "no-store" });
  if (response.status === 404) {
    throw new Error("GitHub returned 404. This URL is private, missing, or mistyped. GitFuel only accepts public repositories.");
  }
  if (response.status === 403 || response.status === 429) {
    throw new Error("GitHub rate limit. Wait, or set GITHUB_TOKEN for a higher limit. Nothing was launched.");
  }
  if (!response.ok) {
    throw new Error(`GitHub responded ${response.status}. The repo was not resolved.`);
  }
  const body = (await response.json()) as {
    id?: number;
    name?: string;
    full_name?: string;
    description?: string | null;
    stargazers_count?: number;
    forks_count?: number;
    language?: string | null;
    html_url?: string;
    private?: boolean;
    owner?: { login?: string; avatar_url?: string };
  };
  if (body.private) {
    throw new Error("Private repositories are out of scope. GitFuel only launches public repos.");
  }
  if (!body.id || !body.owner?.login || !body.name || !body.full_name || !body.html_url || !body.owner.avatar_url) {
    throw new Error("GitHub omitted the numeric repo id or owner. Prefill stopped.");
  }
  const preview: RepoPreview = {
    githubRepoId: body.id,
    owner: body.owner.login,
    name: body.name,
    fullName: body.full_name,
    description: body.description ?? null,
    stars: body.stargazers_count ?? 0,
    forks: body.forks_count ?? 0,
    language: body.language ?? null,
    avatarUrl: body.owner.avatar_url,
    htmlUrl: body.html_url,
  };
  upsertRepo(preview);
  return preview;
}

export function repoResponse(repo: RepoPreview) {
  return { repo, market: getMarketByGithubId(repo.githubRepoId) };
}

export async function githubPermission(token: string, owner: string, repo: string, username: string) {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/collaborators/${encodeURIComponent(username)}/permission`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "User-Agent": "GitFuel",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      cache: "no-store",
    },
  );
  if (response.status === 404) return { permission: "none" as const };
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub permission check failed (${response.status}). ${text.slice(0, 180)}`);
  }
  const body = (await response.json()) as { permission?: string };
  return { permission: body.permission || "none" };
}

export type RepoPreview = {
  githubRepoId: number;
  owner: string;
  name: string;
  fullName: string;
  description: string | null;
  stars: number;
  forks: number;
  language: string | null;
  avatarUrl: string;
  htmlUrl: string;
};

export type ClaimStatus = "unclaimed" | "pending" | "active" | "revoked";

export type Market = RepoPreview & {
  coinName: string;
  symbol: string;
  mint: string;
  metadataUri: string;
  imageUrl: string | null;
  launcher: string;
  bondingComplete: boolean;
  pumpswapPool: string | null;
  confirmed: boolean;
  createdAt: string;
  claimStatus: ClaimStatus;
  claimedWallet: string | null;
  claimedByGithubUserId: number | null;
};

export type ClaimRecord = {
  githubRepoId: number;
  githubUserId: number;
  githubLogin: string;
  solanaPubkey: string;
  status: Exclude<ClaimStatus, "unclaimed">;
  permission: string | null;
  verifiedAt: string | null;
};

export type ClaimEvent = {
  id: number;
  githubRepoId: number;
  kind: string;
  detail: string;
  createdAt: string;
};

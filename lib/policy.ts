export const CREATOR_FEE_SPLIT = [
  { bucket: "Verified GitHub owner/admin", bps: 7000, share: "70%", note: "Primary Builders earn destination" },
  { bucket: "Launcher", bps: 1500, share: "15%", note: "Incentive to surface the repo" },
  { bucket: "Platform", bps: 1500, share: "15%", note: "Feeds the $GITFUEL policy below" },
] as const;

export const GFUL_POLICY = [
  { destination: "Buyback reserve", bps: 6000, share: "60%", purpose: "Future open-market buys of $GITFUEL. Announced only when real." },
  { destination: "Protocol liquidity", bps: 2000, share: "20%", purpose: "Deepen $GITFUEL / SOL liquidity after a venue exists." },
  { destination: "Treasury", bps: 2000, share: "20%", purpose: "Infra, audits, legal, grants." },
] as const;

export const policyPayload = {
  status: "proposed" as const,
  label: "PROPOSED",
  preTge: !process.env.NEXT_PUBLIC_GFUL_MINT,
  mint: process.env.NEXT_PUBLIC_GFUL_MINT || null,
  creatorFees: CREATOR_FEE_SPLIT,
  gfulAllocation: GFUL_POLICY,
  executions: [] as Array<{ period: string; inflow: string; allocated: string; status: string; tx: string }>,
  note: "Revenue and buyback figures are proposed policy. This endpoint never fabricates executions.",
};

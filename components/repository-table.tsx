import Link from "next/link";
import { ArrowUpRight, Check, Eye, Star } from "lucide-react";
import type { ReactNode } from "react";
import type { Market } from "@/lib/types";
import { formatLaunched, formatStars, shortKey } from "@/lib/format";

export function RepositoryTable({ markets, emptyContent }: { markets: Market[]; emptyContent?: ReactNode }) {
  return (
    <div className="repository-table-panel">
      <div className="repository-table-scroll" role="region" aria-label="Repository markets" tabIndex={0}>
        <table className="repository-table">
          <caption className="sr-only">Repository markets with builder verification, token information, and GitHub stars. Financial metrics are not yet available.</caption>
          <thead><tr>
            <th scope="col" className="repo-rank">#</th>
            <th scope="col">Repository</th>
            <th scope="col">Token</th>
            <th scope="col">Mint</th>
            <th scope="col">Launched</th>
            <th scope="col">Market cap</th>
            <th scope="col">24h volume</th>
            <th scope="col">Builder earnings</th>
            <th scope="col">Stars</th>
            <th scope="col" className="repo-action-heading">Action</th>
          </tr></thead>
          <tbody>
            {markets.map((market, index) => (
              <tr key={market.mint}>
                <td className="repo-rank">{String(index + 1).padStart(2, "0")}</td>
                <td className="repo-identity-cell">
                  <div className="repo-identity">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={market.avatarUrl} alt="" width={42} height={42} loading="lazy" className="repo-avatar" />
                    <div className="min-w-0">
                      <Link href={`/market/${market.mint}`} className="repo-name" title={market.fullName}>{market.fullName}</Link>
                      <p className="repo-description" title={market.description || "Public GitHub repository"}>{market.description || "Public GitHub repository"}</p>
                      <span className={`repo-verification ${market.claimStatus === "active" ? "is-verified" : ""}`}>
                        {market.claimStatus === "active" && <Check size={10} aria-hidden="true" />}
                        {market.claimStatus === "active" ? "Verified builder" : market.claimStatus === "pending" ? "Verification pending" : "Unclaimed builder"}
                      </span>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="repo-symbol" title={market.coinName}>${market.symbol}</span>
                  <span className="repo-secondary">{market.coinName}</span>
                  <span className="repo-secondary">{market.bondingComplete ? "PumpSwap" : "Bonding curve"}</span>
                </td>
                <td>{market.mint ? <span className="repo-mint" title={market.mint}>{shortKey(market.mint, 4)}</span> : <span className="repo-unavailable">—</span>}</td>
                <td><time className="repo-launched" dateTime={market.createdAt}>{formatLaunched(market.createdAt)}</time></td>
                <td><UnavailableMetric label="Market cap" /></td>
                <td><UnavailableMetric label="24-hour volume" /></td>
                <td><UnavailableMetric label="Builder earnings" /></td>
                <td><span className="repo-stars" title={`${market.stars.toLocaleString("en")} GitHub stars`}><Star size={13} aria-hidden="true" />{formatStars(market.stars)}</span></td>
                <td><div className="repo-actions">
                  <a href={market.htmlUrl} target="_blank" rel="noopener noreferrer" className="repo-preview" aria-label={`View ${market.fullName} on GitHub`}><Eye size={15} aria-hidden="true" /></a>
                  <Link href={`/market/${market.mint}`} className="repo-trade" aria-label={`Trade ${market.symbol}`}>Trade <ArrowUpRight size={13} aria-hidden="true" /></Link>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {markets.length === 0 && emptyContent}
      {markets.length > 0 && <p className="repo-data-note">— Market cap, volume, and earnings data are not available yet. Open a market to check its current on-chain state.</p>}
    </div>
  );
}

function UnavailableMetric({ label }: { label: string }) {
  return <span className="repo-unavailable" aria-label={`${label} unavailable`} title={`${label} data is not available yet`}>—</span>;
}

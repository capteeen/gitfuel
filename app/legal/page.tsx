export default function LegalPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-8 text-sm leading-relaxed text-[#C9DDD0]">
      <header>
        <h1 className="font-display text-5xl text-white">Legal</h1>
        <p className="mt-3">Not legal advice. Have counsel review before mainnet, public token solicitation, or marketing in your jurisdictions. This page is the product-kit checklist for GitFuel.</p>
      </header>
      <section>
        <h2 className="text-xl text-white">1. Nature of the product</h2>
        <p className="mt-2">GitFuel is software that helps users launch and trade Solana tokens associated with public GitHub repositories via pump.fun / PumpSwap. Tokens may be extremely volatile, illiquid, or worthless. Nothing in the app is financial, investment, or legal advice.</p>
      </section>
      <section>
        <h2 className="text-xl text-white">2. No affiliation</h2>
        <p className="mt-2">GitFuel is not affiliated with, endorsed by, or sponsored by:</p>
        <ul className="mt-2 list-disc pl-5">
          <li>GitHub, Inc. / Microsoft</li>
          <li>pump.fun / PumpSwap operators</li>
          <li>Solana Foundation</li>
          <li>repo.ing / REPOING or related entities</li>
        </ul>
        <p className="mt-2">GitHub® and other marks belong to their owners. Use of public GitHub APIs and public repo metadata is under GitHub Terms; this app does not imply an official partnership.</p>
      </section>
      <section>
        <h2 className="text-xl text-white">3. Trademarks and brand</h2>
        <p className="mt-2">GitFuel is an original brand and is not repo.ing / REPOING. It does not copy those logos, mascots, diagram artwork, or trademarked phrases. Factual comparison belongs in docs, not in the wordmark.</p>
      </section>
      <section>
        <h2 className="text-xl text-white">4. Tokens and securities risk</h2>
        <p className="mt-2">Launching or promoting tokens can implicate securities, commodities, and money-transmission rules depending on jurisdiction and how $GFUL or repo coins are marketed. Avoid promises of profit, guaranteed buybacks, or passive income. Proposed revenue and buyback policies stay labeled proposed until executed under a reviewed policy. This interface does not fabricate transactions.</p>
      </section>
      <section id="claims">
        <h2 className="text-xl text-white">5. Creator fees and claims</h2>
        <p className="mt-2">Fee routing to a verified GitHub owner or admin depends on OAuth and GitHub permission data that can change: admin removed, repo transferred, org policy changed. A claim is proof of control at verification time, not a legal ownership finding. Contested claims, stolen accounts, and org disputes need a published process — freeze, dual-control, support — before anyone promises irrevocable payouts. Phase 1 does not run that dispute process. Escrow and fee-sharing configs should be described as they are: until a verified claim, the builder slice may sit on a platform treasury pubkey, and the launcher who created the sharing config remains the admin who can change shares.</p>
      </section>
      <section>
        <h2 className="text-xl text-white">6. User content and IP</h2>
        <p className="mt-2">Repo names, descriptions, and avatars are third-party content. Launching a coin does not grant IP rights in the software. The app blocks private repos. Do not impersonate projects with deceptive metadata, and do not violate GitHub or pump.fun terms. Abuse and takedown contacts should be published before a public launch. This build does not invent an inbox.</p>
      </section>
      <section>
        <h2 className="text-xl text-white">7. Sanctions, geo, AML</h2>
        <p className="mt-2">Consider geoblocking or soft warnings where required. Phase 1 is designed around user-signed transactions and does not take custody of trade proceeds. A hot wallet or custodial crank, if one is added later, is high-risk and needs audits, key management, and disclosures. The labeled treasury address used for an interim fee share is not a promise of custody quality.</p>
      </section>
      <section>
        <h2 className="text-xl text-white">8. Privacy</h2>
        <p className="mt-2">OAuth tokens are stored in an encrypted session cookie with the GitHub user id and login, and only so the permission check can run. Declare retention before production and encrypt at rest if the token moves to a database. A privacy policy should cover GitHub profile data, wallet addresses, IP logs, and analytics. Public markets can expose a link between a GitHub identity and a Solana wallet once a builder claims. The claim screen says that before you bind.</p>
      </section>
      <section>
        <h2 className="text-xl text-white">9. Open source and third-party licenses</h2>
        <p className="mt-2">Respect the licenses of @pump-fun/pump-sdk, wallet-adapter, and the other dependencies. If GitFuel itself is open-sourced, pick an SPDX license and a CONTRIBUTING guide first.</p>
      </section>
      <section>
        <h2 className="text-xl text-white">10. Disclaimer</h2>
        <p className="mt-2">GitFuel is experimental software. Tokens can lose all value. Not affiliated with GitHub or pump.fun. No investment advice. Creator fee claims require GitHub admin verification and are not guarantees of payment. Revenue and buyback figures are proposed policies unless linked to verified on-chain transactions.</p>
      </section>
      <section>
        <h2 className="text-xl text-white">11. Before public launch</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Counsel review (token, consumer, terms, privacy)</li>
          <li>Terms of service, privacy policy, cookie notice</li>
          <li>Abuse, DMCA, and impersonation contacts</li>
          <li>Multisig for treasury; avoid a single-EOA policy fund</li>
          <li>Fee-sharing docs that match the on-chain config</li>
          <li>No placeholder “executed buyback” UI — this build does not have one</li>
          <li>Trademark search for GitFuel / GFUL in the markets you enter</li>
        </ul>
      </section>
    </article>
  );
}

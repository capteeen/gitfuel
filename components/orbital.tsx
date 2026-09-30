import Link from "next/link";
import { Mark } from "./logo";

export function Orbital() {
  return (
    <div className="relative mx-auto h-[500px] w-full max-w-[620px]">
      <svg viewBox="0 0 640 520" className="h-full w-full" role="img" aria-label="Fuel cell in orbit">
        <ellipse className="orbit-spin" cx="320" cy="250" rx="210" ry="86" fill="none" stroke="rgba(255,255,255,0.45)" strokeDasharray="2 7" />
        <g>
          <rect x="118" y="214" width="150" height="96" rx="8" fill="#102033" stroke="#39FF14" strokeOpacity="0.45" />
          {Array.from({ length: 5 }).map((_, row) =>
            Array.from({ length: 7 }).map((__, col) => (
              <rect key={`${row}-${col}`} x={130 + col * 18} y={226 + row * 16} width="12" height="10" rx="1" fill="#16385a" stroke="#7ec8ff" strokeOpacity="0.35" />
            )),
          )}
          <rect x="392" y="198" width="150" height="108" rx="8" transform="rotate(18 467 252)" fill="#102033" stroke="#39FF14" strokeOpacity="0.45" />
          <path d="M250 286c40 8 78 8 130-18l18 34c-62 36-112 34-166 16z" fill="#1a1e22" />
          <rect x="268" y="214" width="168" height="78" rx="39" fill="url(#body)" />
          <rect x="392" y="222" width="28" height="62" fill="#d7dde4" />
          <path d="M430 230c46 8 62 22 62 31s-18 22-62 28z" fill="#0e1214" />
          <circle cx="476" cy="253" r="6" fill="#39FF14" />
          <defs>
            <linearGradient id="body" x1="268" y1="214" x2="436" y2="292">
              <stop offset="0" stopColor="#9aa3ab" />
              <stop offset="0.45" stopColor="#f4f7f8" />
              <stop offset="1" stopColor="#2a3036" />
            </linearGradient>
          </defs>
        </g>
        <g>
          <circle cx="214" cy="188" r="4" fill="#39FF14" />
          <text x="164" y="176" fill="#E8F5E9" fontSize="11" fontFamily="ui-monospace, monospace">
            GitHub ID
          </text>
        </g>
      </svg>
      <Link href="/launch" className="glass-light absolute top-16 right-0 flex w-[148px] items-start justify-between p-4 md:right-2">
        <span className="text-[22px] leading-none font-medium tracking-tight">Paste a URL</span>
        <span className="grid h-8 w-8 place-items-center rounded-full bg-[#14120f] text-white">
          <Mark className="h-3.5 w-3.5" />
        </span>
      </Link>
    </div>
  );
}

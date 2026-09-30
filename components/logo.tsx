export function Mark({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <path d="M7 6h4.2v20H7V6zm7.2 0H27v4.1H14.2V6zm0 7.8H24v4.1H14.2v-4.1z" fill="#E8F5E9" />
      <circle cx="25.2" cy="6.2" r="2.2" fill="#39FF14" />
    </svg>
  );
}

export function Logo() {
  return (
    <a href="/" className="inline-flex items-center gap-2 text-[15px] font-semibold tracking-tight text-white">
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#101612] ring-1 ring-[#39FF14]/40">
        <Mark />
      </span>
      GitFuel
    </a>
  );
}

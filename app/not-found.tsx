import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl py-16 text-center">
      <p className="font-mono text-xs text-[#9CB7FF]">404</p>
      <h1 className="mt-3 font-display text-5xl text-white">Repo not found / market missing</h1>
      <p className="mt-3 text-sm text-[#9DA8BE]">That GitHub id is not cached, or no mint is registered for it.</p>
      <Link href="/launch" className="mt-6 inline-flex rounded-full bg-[#9CB7FF] px-4 py-2 text-sm font-semibold text-[#0A1020]">
        Paste a GitHub URL
      </Link>
    </div>
  );
}

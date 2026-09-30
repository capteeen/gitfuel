import Image from "next/image";
import Link from "next/link";

export function Mark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <Image
      src="/brand/gitfuel-logo-blue.png"
      alt=""
      width={1024}
      height={1024}
      sizes="80px"
      className={className}
      aria-hidden="true"
    />
  );
}

export function Logo() {
  return (
    <Link href="/" className="inline-flex items-center gap-2 text-[15px] font-semibold tracking-tight text-white">
      <Mark />
      GitFuel
    </Link>
  );
}

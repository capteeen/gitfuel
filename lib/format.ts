export function shortKey(value: string, size = 4) {
  if (!value) return "";
  if (value.length <= size * 2 + 1) return value;
  return `${value.slice(0, size)}…${value.slice(-size)}`;
}

export function formatLaunched(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

export function formatStars(stars: number) {
  return new Intl.NumberFormat("en", { notation: "compact" }).format(stars);
}

export function suggestSymbol(name: string) {
  const symbol = name.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 10);
  return symbol || "REPO";
}

export function lamportsToSol(lamports: number) {
  return lamports / 1_000_000_000;
}

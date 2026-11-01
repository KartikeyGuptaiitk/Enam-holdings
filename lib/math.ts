export function delta(current: number, previous: number) {
  return previous === 0
    ? null
    : ((current - previous) / Math.abs(previous)) * 100;
}
export function margin(profit: number, revenue: number) {
  return revenue === 0 ? null : (profit / revenue) * 100;
}
export function credibility(verdicts: string[]) {
  const counted = verdicts.filter((v) =>
    ["met", "partially", "missed"].includes(v),
  );
  return counted.length
    ? Math.round(
        (counted.reduce(
          (s, v) => s + (v === "met" ? 1 : v === "partially" ? 0.5 : 0),
          0,
        ) /
          counted.length) *
          100,
      )
    : null;
}
export const numeric = (s: string) => Number(s.replace(/[, %]/g, ""));

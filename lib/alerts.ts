export type Rule = {
  move: number;
  volume: number;
  minimum: number;
  categories: string[];
  ticker: string;
};
export function triggers(
  rule: Rule,
  item: {
    ticker: string;
    move?: number;
    volume?: number;
    score?: number;
    category?: string;
  },
) {
  if (rule.ticker && rule.ticker !== item.ticker) return false;
  return (
    Math.abs(item.move ?? 0) >= rule.move ||
    (item.volume ?? 0) >= rule.volume ||
    !!(
      item.category &&
      rule.categories.includes(item.category) &&
      (item.score ?? 0) >= rule.minimum
    )
  );
}

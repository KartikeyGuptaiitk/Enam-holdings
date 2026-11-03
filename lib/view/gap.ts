// Presentation-only scale. Never changes a financial verdict.
export function gapScale(target: string, delivered: string) {
  const range = target.match(/(-?\d+(?:\.\d+)?)\s*[–−]\s*(-?\d+(?:\.\d+)?)/);
  const actual = delivered.match(/^(-?\d+(?:\.\d+)?)%/);
  if (!range || !actual) return null;
  const low = Number(range[1]),
    high = Number(range[2]),
    value = Number(actual[1]);
  if (high < low) return null;
  const padding = Math.max((high - low) * 0.5, 1);
  const min = Math.min(low, value) - padding,
    max = Math.max(high, value) + padding;
  const position = (n: number) => ((n - min) / (max - min)) * 100;
  return {
    low,
    high,
    value,
    start: position(low),
    width: position(high) - position(low),
    actual: position(value),
  };
}

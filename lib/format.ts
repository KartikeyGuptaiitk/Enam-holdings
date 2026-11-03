export const number = (value: number, digits = 1) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: digits }).format(
    value,
  );
export const percent = (value: number | null) =>
  value === null ? "—" : `${value >= 0 ? "↑ +" : "↓ "}${value.toFixed(1)}%`;

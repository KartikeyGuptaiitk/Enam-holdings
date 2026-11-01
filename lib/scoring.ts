export const weights: Record<string, number> = {
  results: 90,
  "M&A": 85,
  management_change: 85,
  litigation: 75,
  fund_raise: 70,
  credit_rating: 40,
  pledging: 70,
  insider_trading: 55,
  capex: 55,
  dividend: 50,
  bonus_split: 45,
  earnings_call: 35,
  investor_meetings: 20,
  press_release: 30,
  agm_egm: 15,
  postal_ballot: 15,
  unclassified: 5,
};
export function score(
  category: string,
  weight: number,
  ageHours: number,
  move = 0,
  volume = 0,
  headline = "",
) {
  let base = weights[category] ?? 5;
  if (
    category === "management_change" &&
    !/chief|ceo|cfo|managing director/i.test(headline)
  )
    base = 45;
  if (category === "credit_rating" && /downgrad/i.test(headline)) base = 80;
  const reaction = Math.abs(move) >= 4 || volume >= 2 ? 1.25 : 1;
  return Math.min(
    100,
    Math.round(
      base *
        Math.min(1.5, 1 + weight / 20) *
        Math.pow(0.5, Math.max(0, ageHours) / 24) *
        reaction,
    ),
  );
}
export function tier(s: number) {
  return s >= 70 ? "Must-see" : s >= 40 ? "Worth a look" : "Routine";
}

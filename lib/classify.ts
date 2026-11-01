export const rules: [string, RegExp][] = [
  ["results", /financial result|quarterly result|audited.*result/i],
  ["M&A", /acquisition|merger|demerger|joint venture/i],
  [
    "management_change",
    /management|resign|appoint.*(director|chief)|cessation/i,
  ],
  ["litigation", /litigation|penalty|fine|regulatory order|insolvency/i],
  ["fund_raise", /fund rais|qip|rights issue|buyback|commercial paper/i],
  ["credit_rating", /credit rating|rating/i],
  ["pledging", /pledge|pledging/i],
  ["insider_trading", /insider|personal.*trade|disclosure.*29/i],
  ["dividend", /dividend/i],
  ["bonus_split", /bonus|split/i],
  ["capex", /capex|capacity expansion/i],
  ["earnings_call", /con.*call|earnings call|transcript/i],
  ["investor_meetings", /investor.*meet|analyst.*meet/i],
  ["postal_ballot", /postal ballot/i],
  ["agm_egm", /annual general|extraordinary|agm|egm/i],
  ["press_release", /press release|order win|product launch/i],
];
export function classify(text: string) {
  const [headline, body = ""] = text.split(" · ");
  if (
    /Schedule A of Regulation 8|code of.*insider/i.test(text) &&
    !/(?:purchase|sale|sold|bought)/i.test(text)
  )
    return "unclassified";
  if (
    /newspaper publication|compliance certificate|trading window|Certificate under SEBI|ESOP|ESG Rating/i.test(
      headline + " " + (/ESG Rating/i.test(body) ? body : ""),
    )
  )
    return "unclassified";
  if (/con.*call|earnings call|transcript/i.test(headline)) {
    if (/schedule of (investor )?meet|outcome of analyst/i.test(body))
      return "investor_meetings";
    if (/presentation.*quarter/i.test(body)) return "results";
    return "earnings_call";
  }
  if (/dividend/i.test(headline)) return "dividend";
  if (/investor presentation/i.test(headline)) return "results";
  if (/retirement/i.test(headline)) return "management_change";
  if (/postal ballot/i.test(body) && /shareholders meeting/i.test(headline))
    return "postal_ballot";
  if (/non convertible|issue of securities/i.test(text)) return "fund_raise";
  return rules.find(([, r]) => r.test(text))?.[0] ?? "unclassified";
}

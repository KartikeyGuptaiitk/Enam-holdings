import { z } from "zod";
export const FilingSchema = z.object({
  id: z.string(),
  ticker: z.string(),
  ts_iso: z.string(),
  headline: z.string(),
  body: z.string(),
  attachment_url: z.string(),
  source: z.string(),
  category: z.string(),
});
export type Filing = z.infer<typeof FilingSchema>;
export const CitationSchema = z.object({
  doc_id: z.string(),
  page: z.number().int().nonnegative(),
  text: z.string(),
  url: z.string(),
  period: z.string(),
});
export type Citation = z.infer<typeof CitationSchema>;
export const ResearchSchema = z.object({
  ticker: z.string(),
  status: z.string(),
  source_url: z.string().optional(),
  tables: z.record(z.array(z.array(z.string()))),
  docs: z.array(z.any()),
  chunks: z.array(CitationSchema.extend({ doc_type: z.string() })),
});
export type Research = z.infer<typeof ResearchSchema>;
export const VerdictSchema = z.object({
  statement: z.string(),
  metric: z.string(),
  target: z.string(),
  delivered: z.string(),
  verdict: z.enum(["met", "partially", "missed", "unclear", "not_yet_due"]),
  sources: z.array(CitationSchema).min(1),
});

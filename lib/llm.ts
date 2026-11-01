import { createHash } from "node:crypto";
import fs from "node:fs/promises";
export const GROUNDING = `Use ONLY the provided CONTEXT of annual reports, earnings-call transcripts and Screener standardized financials. Answer only from provided context; cite doc + page and a supporting quote of <=25 words. Otherwise output not_disclosed. Do not use company knowledge from memory. Output strictly valid JSON matching the schema. Do not do arithmetic.`;
export async function llm(
  task: string,
  context: string,
  schema: unknown,
  strong = false,
) {
  const provider = process.env.LLM_PROVIDER || "gemini";
  const model =
    (strong ? process.env.LLM_STRONG_MODEL : process.env.LLM_CHEAP_MODEL) ||
    "gemini-2.5-flash";
  const prompt = JSON.stringify({ system: GROUNDING, task, context, schema });
  const hash = createHash("sha256")
    .update(provider + model + prompt)
    .digest("hex");
  const file = `data/cache/llm/${hash}.json`;
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch {}
  const key = process.env.LLM_API_KEY;
  if (!key)
    return {
      status: "not_available",
      reason: "No API key; using deterministic snapshot",
    };
  let url: string,
    body: unknown,
    headers: Record<string, string> = { "Content-Type": "application/json" };
  if (provider === "gemini") {
    url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    headers["x-goog-api-key"] = key;
    body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    };
  } else if (provider === "anthropic") {
    url = "https://api.anthropic.com/v1/messages";
    headers = {
      ...headers,
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    };
    body = {
      model,
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    };
  } else {
    url =
      provider === "groq"
        ? "https://api.groq.com/openai/v1/chat/completions"
        : provider === "openrouter"
          ? "https://openrouter.ai/api/v1/chat/completions"
          : "https://api.openai.com/v1/chat/completions";
    headers.Authorization = `Bearer ${key}`;
    body = {
      model,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    };
  }
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(45000),
  });
  if (!response.ok) throw Error(`Provider returned ${response.status}`);
  const raw = await response.json();
  const text =
    provider === "gemini"
      ? raw.candidates?.[0]?.content?.parts?.[0]?.text
      : provider === "anthropic"
        ? raw.content?.[0]?.text
        : raw.choices?.[0]?.message?.content;
  const output = {
    result: JSON.parse(text),
    usage: raw.usageMetadata ?? raw.usage ?? {},
    model,
    provider,
  };
  await fs.mkdir("data/cache/llm", { recursive: true });
  await fs.writeFile(file, JSON.stringify(output));
  return output;
}

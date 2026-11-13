import { NextResponse } from "next/server";
import { AI_INPUT_MAX, buildEstimatePrompt, parseEstimates } from "@/lib/estimate";
import { estimateLimiter } from "@/lib/server/auth";
import { requireSession } from "@/lib/server/session";

/*
 * Server-side proxy to DeepSeek, so the API key never reaches the browser.
 * Set DEEPSEEK_API_KEY (and optionally DEEPSEEK_MODEL) in .env.local.
 */
const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";
const DEFAULT_MODEL = "deepseek-flash";

const fail = (status: number, error: string) => NextResponse.json({ error }, { status });

export async function POST(request: Request) {
  // Only signed-in people can spend the DeepSeek balance, and only so fast.
  const guard = await requireSession(request);
  if (!guard.ok) return guard.response;
  const limitKey = guard.session.user.id;
  const wait = estimateLimiter.retryAfter(limitKey);
  if (wait > 0) {
    return fail(
      429,
      `You've used AI input a lot in the last hour. Try again in ${Math.ceil(wait / 60000)} minutes, or use manual input.`,
    );
  }

  let text: unknown;
  try {
    ({ text } = await request.json());
  } catch {
    return fail(400, "Send the food description as JSON.");
  }

  const input = typeof text === "string" ? text.trim() : "";
  if (!input) return fail(400, "Describe the food first.");
  if (input.length > AI_INPUT_MAX) {
    return fail(400, `Keep the description to ${AI_INPUT_MAX} characters or fewer.`);
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return fail(
      503,
      "AI input isn't set up yet: add DEEPSEEK_API_KEY to .env.local and restart the server.",
    );
  }

  // Counted when a call to DeepSeek is actually made.
  estimateLimiter.record(limitKey);

  let response: Response;
  try {
    response = await fetch(DEEPSEEK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL || DEFAULT_MODEL,
        messages: [{ role: "user", content: buildEstimatePrompt(input) }],
        temperature: 0,
        // deepseek-flash "thinks" by default and spends the token budget on it,
        // leaving an empty answer. A one-line estimate doesn't need it.
        thinking: { type: "disabled" },
        max_tokens: 300,
      }),
      signal: AbortSignal.timeout(20000),
    });
  } catch {
    return fail(502, "DeepSeek didn't answer in time. Try again, or use manual input.");
  }

  if (!response.ok) {
    const reason =
      response.status === 401
        ? "DeepSeek rejected the API key. Check DEEPSEEK_API_KEY."
        : response.status === 402
          ? "The DeepSeek account has no balance left."
          : response.status === 429
            ? "DeepSeek is rate limiting requests. Wait a moment and try again."
            : `DeepSeek returned an error (${response.status}). Try again, or use manual input.`;
    return fail(502, reason);
  }

  const data = await response.json().catch(() => null);
  const reply: unknown = data?.choices?.[0]?.message?.content;
  const items = typeof reply === "string" ? parseEstimates(reply) : null;
  if (!items) {
    return fail(
      502,
      "The AI's answer wasn't a usable estimate. Try describing the food differently, or use manual input.",
    );
  }

  return NextResponse.json({ items });
}

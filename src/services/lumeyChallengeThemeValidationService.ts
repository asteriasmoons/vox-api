const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL =
  process.env.GROQ_CHALLENGE_MODEL ||
  process.env.GROQ_MODEL ||
  "llama-3.1-8b-instant";

export type ChallengeAIValidationStatus =
  | "approved"
  | "needsMoreInfo"
  | "rejected";

export interface ChallengeAIValidationPacket {
  challengeTitle: string;
  requirementText: string;
  requiredThemes: string[];
  bookTitles: string[];
  bookSummaries: string[];
  bookGenres: string[][];
  bookMoods: string[][];
  bookTags: string[][];
  bookTropes: string[][];
  submissionNote: string;
  linkedReviewText?: string | null;
}

export interface ChallengeAIValidationResponse {
  status: ChallengeAIValidationStatus;
  message: string;
}

export async function validateLumeyChallengeTheme(
  input: ChallengeAIValidationPacket,
): Promise<ChallengeAIValidationResponse> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("Missing GROQ_API_KEY");

  const safeInput = sanitizeInput(input);

  const body = {
    model: MODEL,
    temperature: 0.2,
    max_tokens: 450,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are Lumey's reading challenge validation assistant.

Your job is to decide whether a user's linked books, metadata, review text, and submission note satisfy a fuzzy or theme-based Lumey reading challenge.

Return a JSON object with exactly these keys:
- "status": "approved" | "needsMoreInfo" | "rejected"
- "message": A short friendly explanation.

Rules:
- Be fair, not overly strict.
- If the submitted books clearly match the challenge theme, approve.
- If the submission might qualify but lacks enough explanation or metadata, return needsMoreInfo.
- If the submitted books clearly do not match the challenge, reject.
- Do not approve empty, unrelated, or unsupported submissions.
- Do not mention being an AI.
- Keep the message kind, clear, and user-facing.
- Keep the message to 1-2 sentences.
- Return valid JSON only. No markdown. No code fences. No extra keys.`,
      },
      {
        role: "user",
        content: JSON.stringify(safeInput, null, 2),
      },
    ],
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);

  let resp: Response;

  try {
    resp = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err: any) {
    clearTimeout(timeout);

    if (err?.name === "AbortError") {
      throw new Error("Groq request timed out after 60s");
    }

    throw err;
  } finally {
    clearTimeout(timeout);
  }

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    console.error("[lumey-challenge-theme] Groq error body:", text);
    throw new Error(`Groq error ${resp.status}: ${text}`);
  }

  const json: any = await resp.json();
  const raw = String(json?.choices?.[0]?.message?.content || "").trim();

  let parsed: any;

  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    console.error("[lumey-challenge-theme] JSON parse error:", error);
    throw new Error(`Failed to parse Groq JSON response: ${raw}`);
  }

  const status = normalizeStatus(parsed.status);
  const message = String(parsed.message || "").trim();

  if (!message) {
    throw new Error("Groq returned empty validation message");
  }

  return {
    status,
    message: message.slice(0, 300),
  };
}

function sanitizeInput(
  input: ChallengeAIValidationPacket,
): ChallengeAIValidationPacket {
  return {
    challengeTitle: cleanString(input.challengeTitle, 160),
    requirementText: cleanString(input.requirementText, 300),
    requiredThemes: cleanStringArray(input.requiredThemes, 30, 80),
    bookTitles: cleanStringArray(input.bookTitles, 20, 180),
    bookSummaries: cleanStringArray(input.bookSummaries, 20, 500),
    bookGenres: cleanNestedStringArray(input.bookGenres, 20, 20, 60),
    bookMoods: cleanNestedStringArray(input.bookMoods, 20, 20, 60),
    bookTags: cleanNestedStringArray(input.bookTags, 20, 30, 60),
    bookTropes: cleanNestedStringArray(input.bookTropes, 20, 30, 60),
    submissionNote: cleanString(input.submissionNote, 1200),
    linkedReviewText: cleanString(input.linkedReviewText ?? "", 2000),
  };
}

function cleanString(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function cleanStringArray(
  value: unknown,
  maxItems: number,
  maxItemLength: number,
): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().slice(0, maxItemLength))
    .filter((item) => item.length > 0)
    .slice(0, maxItems);
}

function cleanNestedStringArray(
  value: unknown,
  maxOuterItems: number,
  maxInnerItems: number,
  maxItemLength: number,
): string[][] {
  if (!Array.isArray(value)) return [];

  return value
    .map((inner) => cleanStringArray(inner, maxInnerItems, maxItemLength))
    .slice(0, maxOuterItems);
}

function normalizeStatus(value: unknown): ChallengeAIValidationStatus {
  if (value === "approved") return "approved";
  if (value === "rejected") return "rejected";
  return "needsMoreInfo";
}

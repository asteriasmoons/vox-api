const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_GROQ_MODEL = "moonshotai/kimi-k2-instruct-0905";

type GroqChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

export type CurrentCorrespondencesInput = {
  date?: string;
  weekday?: string;
  planetaryDay: string;
  planetaryHour?: string;
  nextPlanetaryHour?: string;
  moonPhase?: string;
  moonSign?: string;
  moonIlluminationPercent?: number;
  upcomingSabbat?: string;
  daysUntilSabbat?: number;
};

export type CurrentCorrespondencesResponse = {
  title: string;
  message: string;
  planet: string;
  element: string;
  color: string;
  crystal: string;
  herb: string;
  keywords: string[];
};

async function callGroq(prompt: string, apiKey: string): Promise<string> {
  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 520,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Groq error ${response.status}: ${text}`);
  }

  const data = (await response.json()) as GroqChatCompletionResponse;
  return String(data?.choices?.[0]?.message?.content ?? "").trim();
}

function parseAIResponse(raw: string): CurrentCorrespondencesResponse | null {
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;

    const parsed = JSON.parse(match[0]);

    if (
      typeof parsed.title === "string" &&
      typeof parsed.message === "string" &&
      typeof parsed.planet === "string" &&
      typeof parsed.element === "string" &&
      typeof parsed.color === "string" &&
      typeof parsed.crystal === "string" &&
      typeof parsed.herb === "string" &&
      Array.isArray(parsed.keywords)
    ) {
      return parsed as CurrentCorrespondencesResponse;
    }

    return null;
  } catch {
    return null;
  }
}

function cleanSingleWordKeywords(keywords: string[]): string[] {
  return keywords
    .filter(
      (keyword) =>
        typeof keyword === "string" &&
        keyword.trim().length > 0 &&
        keyword.trim().split(/\s+/).length === 1 &&
        !keyword.includes("-"),
    )
    .map((keyword) => keyword.trim())
    .slice(0, 6);
}

function optionalContextLine(label: string, value: unknown): string | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return `${label}: "${String(value).trim()}"`;
}

function buildCurrentCorrespondencesPrompt(
  input: CurrentCorrespondencesInput,
): string {
  const contextLines = [
    optionalContextLine("Date", input.date),
    optionalContextLine("Weekday", input.weekday),
    optionalContextLine("Planetary day", input.planetaryDay),
    optionalContextLine("Current planetary hour", input.planetaryHour),
    optionalContextLine("Next planetary hour", input.nextPlanetaryHour),
    optionalContextLine("Moon phase", input.moonPhase),
    optionalContextLine("Moon zodiac sign", input.moonSign),
    optionalContextLine(
      "Moon illumination percent",
      input.moonIlluminationPercent,
    ),
    optionalContextLine("Upcoming sabbat", input.upcomingSabbat),
    optionalContextLine("Days until sabbat", input.daysUntilSabbat),
  ].filter((line): line is string => Boolean(line));

  return `
You are creating daily spiritual correspondences for a cozy mystical iOS app.

Use the supplied daily context to choose today's correspondences. Return valid JSON only
with exactly these keys: title, message, planet, element, color, crystal, herb, keywords.

Daily context:
${contextLines.join("\n")}

=== STRICT RULES ===

ABOUT WHAT YOU ARE:
- You are offering symbolic spiritual correspondences only.
- Do not present correspondences, astrology, planetary hours, moon symbolism, crystals,
herbs, colors, or elements as scientific or medical facts.
- You are not a doctor, therapist, lawyer, financial advisor, or life coach.
- Do not diagnose, prescribe, predict certain events, or tell the user what to do.
- Do not claim supernatural certainty.

ABOUT THE CORRESPONDENCES:
- The planet must match the supplied planetary day unless another supplied context makes
the current planetary hour clearly more relevant.
- The element, color, crystal, and herb must feel coherent with the selected planet and
the supplied moon or sabbat context.
- Prefer common, recognizable correspondences over obscure choices.
- Do not choose unsafe, toxic, illegal, or medically framed herbs.
- Herb must be a simple common herb or flower name suitable for symbolic use.
- Crystal must be a common crystal name.
- Color must be one concise color name, not a sentence.
- Element must be exactly one of: Fire, Water, Air, Earth.

ABOUT TONE:
- Be warm, grounded, calm, and specific.
- Avoid vague spiritual filler.
- Avoid dramatic, ominous, fear-based, shaming, or urgent language.
- Do not overpraise.

ABOUT MESSAGE:
- The message must be 1 to 2 sentences.
- Keep it present-focused and reflective.
- Do not mention that this was generated by AI.
- Do not include ritual instructions, medical claims, or guaranteed outcomes.

ABOUT KEYWORDS:
- Return exactly 4 to 6 keywords.
- Every keyword must be a single word only.
- No hyphenated words.
- No phrases.

ABOUT FORMAT:
- Return JSON only.
- No markdown.
- No preamble.
- No backticks.

Output shape:
{
  "title": "Today's energies",
  "message": "1 to 2 grounded sentences.",
  "planet": "Venus",
  "element": "Water",
  "color": "Green",
  "crystal": "Rose Quartz",
  "herb": "Rose",
  "keywords": ["harmony", "beauty", "connection", "softness"]
}
`;
}

export async function generateCurrentCorrespondences(
  input: CurrentCorrespondencesInput,
): Promise<CurrentCorrespondencesResponse> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("Missing GROQ_API_KEY");
  }

  const raw = await callGroq(buildCurrentCorrespondencesPrompt(input), apiKey);
  const parsed = parseAIResponse(raw);

  if (!parsed) {
    throw new Error(`AI returned unparseable response: ${raw}`);
  }

  const keywords = cleanSingleWordKeywords(parsed.keywords);

  if (keywords.length < 4) {
    throw new Error(`AI returned too few valid keywords: ${raw}`);
  }

  return {
    title: parsed.title.trim(),
    message: parsed.message.trim(),
    planet: parsed.planet.trim(),
    element: parsed.element.trim(),
    color: parsed.color.trim(),
    crystal: parsed.crystal.trim(),
    herb: parsed.herb.trim(),
    keywords,
  };
}

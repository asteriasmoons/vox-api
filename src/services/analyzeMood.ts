const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

export interface MoodAnalysisInput {
  emotions: { name: string; category: "positive" | "neutral" | "negative" }[];
  activities: string[];
  sleepHours: number;
  exerciseMinutes: number;
  steps: number;
  meditationMinutes: number;
  waterOz: number;
  note: string;
  timestamp: string; // ISO date string
}

export interface MoodAnalysisResult {
  mindset: string;
  emotionalBalance: string;
  influences: string;
  reflection: string;
  themes: string[];
}

export async function analyzeMood(
  input: MoodAnalysisInput,
): Promise<MoodAnalysisResult> {
  const apiKey = process.env.GROQ_API_KEY_ALT;
  if (!apiKey) throw new Error("Missing GROQ_API_KEY_ALT");

  // Build structured context
  const positiveEmotions = input.emotions
    .filter((e) => e.category === "positive")
    .map((e) => e.name);
  const neutralEmotions = input.emotions
    .filter((e) => e.category === "neutral")
    .map((e) => e.name);
  const negativeEmotions = input.emotions
    .filter((e) => e.category === "negative")
    .map((e) => e.name);

  const date = new Date(input.timestamp);
  const hour = date.getHours();
  const timeOfDay =
    hour < 6
      ? "late night"
      : hour < 12
        ? "morning"
        : hour < 17
          ? "afternoon"
          : hour < 21
            ? "evening"
            : "night";

  let lifestyleLines: string[] = [];
  if (input.sleepHours > 0)
    lifestyleLines.push(`Sleep: ${input.sleepHours} hours`);
  if (input.exerciseMinutes > 0)
    lifestyleLines.push(`Exercise: ${input.exerciseMinutes} minutes`);
  if (input.steps > 0) lifestyleLines.push(`Steps: ${input.steps}`);
  if (input.meditationMinutes > 0)
    lifestyleLines.push(`Mindfulness: ${input.meditationMinutes} minutes`);
  if (input.waterOz > 0)
    lifestyleLines.push(`Water: ${input.waterOz} oz`);

  const userContent = `Mood log recorded in the ${timeOfDay} on ${date.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}:

Positive emotions (${positiveEmotions.length}): ${positiveEmotions.join(", ") || "none"}
Neutral emotions (${neutralEmotions.length}): ${neutralEmotions.join(", ") || "none"}
Negative emotions (${negativeEmotions.length}): ${negativeEmotions.join(", ") || "none"}

Activities: ${input.activities.length > 0 ? input.activities.join(", ") : "none selected"}

Lifestyle data:
${lifestyleLines.length > 0 ? lifestyleLines.join("\n") : "No lifestyle data recorded"}

${input.note ? `User note: "${input.note}"` : "No note provided"}`;

  const body = {
    model: MODEL,
    temperature: 0.3,
    max_tokens: 2000,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a mood insight analyzer for a wellness app. You receive a mood log containing selected emotions (categorized as positive, neutral, or negative), selected activities, lifestyle data (sleep, exercise, steps, mindfulness, water), an optional note, and the time of day.

Your job is to produce a grounded, thoughtful reflection of the user's current emotional state.

Return a JSON object with exactly these keys:

"mindset" — A short phrase (3-6 words) describing the user's current mental state. Example: "Reflective and optimistic"

"emotionalBalance" — 1-2 sentences describing the emotional composition. Consider ALL selected emotions together. Do NOT let one negative emotion override several positive or neutral ones. Acknowledge mixed emotions naturally.

"influences" — 1-2 sentences about what may be shaping the mood based on activities, lifestyle data, and the note. Use "may," "appears," "could" language. Treat these as possible influences, not proven causes.

"reflection" — 2-3 sentences offering an overall insight. Acknowledge emotional complexity. If mixed emotions are present, explain how they coexist rather than picking one to define the whole mood.

"themes" — An array of 2-4 short theme words derived from the activities and emotional patterns. Examples: "Creativity", "Self-Care", "Responsibility", "Social Connection", "Rest"

CRITICAL RULES:
- Consider all selected emotions together proportionally
- Do NOT let one negative emotion override several positive or neutral emotions
- Acknowledge mixed emotions as natural and valid
- Use the note as context, not as the only source of truth
- Do NOT diagnose mental health conditions
- Do NOT make alarming or dramatic conclusions
- Do NOT label emotions as wrong, unhealthy, or inappropriate
- Use hedging language: "may suggest," "appears," "could reflect"
- Keep the tone thoughtful, grounded, and nonjudgmental
- Return valid JSON only`,
      },
      {
        role: "user",
        content: userContent,
      },
    ],
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

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
    if (err?.name === "AbortError")
      throw new Error("Groq request timed out after 30s");
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`Groq error ${resp.status}: ${text}`);
  }

  const json: any = await resp.json();
  const raw = String(json?.choices?.[0]?.message?.content || "").trim();

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Failed to parse Groq JSON response: ${raw}`);
  }

  return {
    mindset: String(parsed.mindset || "").trim(),
    emotionalBalance: String(parsed.emotionalBalance || "").trim(),
    influences: String(parsed.influences || "").trim(),
    reflection: String(parsed.reflection || "").trim(),
    themes: Array.isArray(parsed.themes)
      ? parsed.themes.map((t: any) => String(t).trim()).filter(Boolean)
      : [],
  };
}

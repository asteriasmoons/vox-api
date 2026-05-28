"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateJournalPrompt = generateJournalPrompt;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
function pickModel() {
    return process.env.GROQ_MODEL || "llama-3.1-8b-instant";
}
async function generateJournalPrompt() {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        throw new Error("Missing GROQ_API_KEY");
    }
    const body = {
        model: pickModel(),
        temperature: 0.9,
        max_tokens: 120,
        messages: [
            {
                role: "system",
                content: "You generate journaling prompts. Return exactly one prompt. No title, no bullet list, no prefix text. Only the prompt itself. Keep it 1–2 sentences, reflective, emotionally safe, and supportive.",
            },
            {
                role: "user",
                content: "Write a journaling prompt that helps the user reflect on their emotions, growth, or daily life in a gentle and clear way.",
            },
        ],
    };
    const resp = await fetch(GROQ_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });
    if (!resp.ok) {
        const text = await resp.text().catch(() => "");
        throw new Error(`Groq error ${resp.status}: ${text}`);
    }
    const json = await resp.json();
    const content = String(json?.choices?.[0]?.message?.content || "").trim();
    return content.replace(/^["'\s]+|["'\s]+$/g, "").trim();
}
//# sourceMappingURL=generateJournalPrompt.js.map
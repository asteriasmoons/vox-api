import { Router, Request, Response } from "express";
import { runMoodChat, ChatMessage } from "../services/moodChatService";
import {
  generateMoodStatsContext,
  MoodStatsContextRequest,
  MoodStatsPhoneBehaviorInput,
  MoodStatsSummaryInput,
} from "../services/generateMoodStatsContext";

const router = Router();

// POST /api/mood/chat
// Body: { messages: [{ role: "user" | "model", parts: [{ text: string }] }] }
router.post("/chat", async (req: Request, res: Response) => {
  try {
    const { messages } = req.body as { messages: ChatMessage[] };

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: "messages array is required" });
      return;
    }

    // Validate roles — Gemini only accepts "user" | "model"
    const valid = messages.every(
      (m) =>
        (m.role === "user" || m.role === "model") &&
        Array.isArray(m.parts) &&
        m.parts.every((p) => typeof p.text === "string"),
    );

    if (!valid) {
      res.status(400).json({
        error:
          'Each message must have role "user" or "model" and parts: [{ text: string }]',
      });
      return;
    }

    const reply = await runMoodChat(messages);
    res.json({ reply });
  } catch (err: any) {
    console.error("[mood/chat] Error:", err?.message ?? err);
    res.status(500).json({ error: err?.message ?? "Internal server error" });
  }
});

// POST /api/mood/stats/context
// Body: aggregate mood + phone stats only; no raw app names or detailed Screen Time history.
router.post("/stats/context", async (req: Request, res: Response) => {
  try {
    const body = req.body as Partial<MoodStatsContextRequest>;

    if (
      typeof body.date !== "string" ||
      !isValidMoodSummary(body.moodSummary) ||
      !isValidPhoneBehavior(body.phoneBehavior)
    ) {
      res.status(400).json({
        error: "date, moodSummary, and phoneBehavior are required",
      });
      return;
    }

    const requestBody: MoodStatsContextRequest = {
      userId: typeof body.userId === "string" && body.userId.trim() ? body.userId.trim() : "anonymous",
      date: body.date,
      moodSummary: body.moodSummary,
      phoneBehavior: body.phoneBehavior,
      recentSnapshots: Array.isArray(body.recentSnapshots) ? body.recentSnapshots : [],
    };

    const context = await generateMoodStatsContext(requestBody);
    res.json(context);
  } catch (err: any) {
    console.error("[mood/stats/context] Error:", err?.message ?? err);
    res.status(500).json({ error: err?.message ?? "Internal server error" });
  }
});

function isValidMoodSummary(value: unknown): value is MoodStatsSummaryInput {
  const summary = value as MoodStatsSummaryInput;
  return (
    typeof summary === "object" &&
    summary !== null &&
    Number.isFinite(summary.averageMoodPercent) &&
    Number.isFinite(summary.checkInCount) &&
    typeof summary.bestDay === "string" &&
    typeof summary.hardestDay === "string"
  );
}

function isValidPhoneBehavior(value: unknown): value is MoodStatsPhoneBehaviorInput {
  const behavior = value as MoodStatsPhoneBehaviorInput;
  return (
    typeof behavior === "object" &&
    behavior !== null &&
    Number.isFinite(behavior.screenTimeMinutes) &&
    Number.isFinite(behavior.socialAppMinutes) &&
    Number.isFinite(behavior.nighttimePhoneMinutes) &&
    Number.isFinite(behavior.pickupCount) &&
    Number.isFinite(behavior.notificationCount)
  );
}

export default router;

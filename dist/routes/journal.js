"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const claimDailyPrompt_1 = require("../services/claimDailyPrompt");
const generateJournalPrompt_1 = require("../services/generateJournalPrompt");
const generateJournalAnalysis_1 = require("../services/generateJournalAnalysis");
const DailyJournalAnalysis_1 = require("../models/DailyJournalAnalysis");
const chicagoDateKey_1 = require("../utils/chicagoDateKey");
const router = (0, express_1.Router)();
// POST /api/journal/prompt
router.post("/prompt", async (req, res) => {
    try {
        const userId = String(req.body?.userId || "").trim();
        if (!userId) {
            return res.status(400).json({ error: "Missing userId" });
        }
        const quota = await (0, claimDailyPrompt_1.claimDailyPrompt)(userId);
        if (!quota.allowed) {
            return res.status(429).json({
                error: "DAILY_PROMPT_LIMIT_REACHED",
                message: "You've used your 3 prompts for today.",
                remaining: quota.remaining,
                dateKey: quota.dateKey,
            });
        }
        const prompt = await (0, generateJournalPrompt_1.generateJournalPrompt)();
        return res.json({
            prompt,
            remaining: quota.remaining,
            dateKey: quota.dateKey,
        });
    }
    catch (error) {
        console.error("Prompt generation error:", error);
        return res.status(500).json({ error: "Failed to generate prompt" });
    }
});
// GET /api/journal/analyze/dates
router.get("/analyze/dates", async (req, res) => {
    try {
        const userId = String(req.query?.userId || "").trim();
        const bookId = String(req.query?.bookId || "").trim();
        if (!userId || !bookId) {
            return res.status(400).json({ error: "Missing userId or bookId" });
        }
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 90);
        const cutoffKey = (0, chicagoDateKey_1.chicagoDateKey)(cutoff);
        const records = await DailyJournalAnalysis_1.DailyJournalAnalysis.find({ userId, bookId, dateKey: { $gte: cutoffKey } }, { dateKey: 1, _id: 0 })
            .sort({ dateKey: -1 })
            .lean();
        return res.json({ dates: records.map((r) => r.dateKey) });
    }
    catch (error) {
        console.error("Journal dates fetch error:", error);
        return res.status(500).json({ error: "Failed to fetch analysis dates" });
    }
});
// GET /api/journal/analyze
router.get("/analyze", async (req, res) => {
    try {
        const userId = String(req.query?.userId || "").trim();
        const bookId = String(req.query?.bookId || "").trim();
        if (!userId || !bookId) {
            return res.status(400).json({ error: "Missing userId or bookId" });
        }
        const dateKey = String(req.query?.dateKey || "").trim() || (0, chicagoDateKey_1.chicagoDateKey)(new Date());
        const existing = await DailyJournalAnalysis_1.DailyJournalAnalysis.findOne({ userId, bookId, dateKey }).lean();
        if (!existing) {
            return res.json({
                exists: false,
                dateKey,
            });
        }
        return res.json({
            exists: true,
            themes: existing.themes,
            mood: existing.mood,
            reflection: existing.reflection,
            dateKey,
            cached: true,
        });
    }
    catch (error) {
        console.error("Journal fetch error:", error);
        return res.status(500).json({ error: "Failed to fetch analysis" });
    }
});
// POST /api/journal/analyze
router.post("/analyze", async (req, res) => {
    try {
        const userId = String(req.body?.userId || "").trim();
        const bookId = String(req.body?.bookId || "").trim();
        const entries = req.body?.entries ?? [];
        console.log("[analyze] userId:", userId, "bookId:", bookId, "entries count:", entries.length);
        if (entries.length > 0 && entries[0]) {
            const first = entries[0];
            console.log("[analyze] first entry body length:", first.body?.length);
        }
        if (!userId || !bookId) {
            return res.status(400).json({ error: "Missing userId or bookId" });
        }
        if (!Array.isArray(entries) || entries.length === 0) {
            return res.status(400).json({ error: "No entries provided" });
        }
        const dateKey = (0, chicagoDateKey_1.chicagoDateKey)(new Date());
        // Return cached result if already analyzed today for this book
        const existing = await DailyJournalAnalysis_1.DailyJournalAnalysis.findOne({ userId, bookId, dateKey }).lean();
        if (existing) {
            return res.json({
                themes: existing.themes,
                mood: existing.mood,
                reflection: existing.reflection,
                dateKey,
                cached: true,
            });
        }
        const result = await (0, generateJournalAnalysis_1.generateJournalAnalysis)(entries);
        await DailyJournalAnalysis_1.DailyJournalAnalysis.create({
            userId,
            bookId,
            dateKey,
            themes: result.themes,
            mood: result.mood,
            reflection: result.reflection,
        });
        return res.json({
            themes: result.themes,
            mood: result.mood,
            reflection: result.reflection,
            dateKey,
            cached: false,
        });
    }
    catch (error) {
        console.error("Journal analysis error:", error);
        return res.status(500).json({ error: "Failed to generate analysis" });
    }
});
exports.default = router;
//# sourceMappingURL=journal.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
const API_NINJAS_URL = "https://api.api-ninjas.com/v1/horoscope";
const VALID_SIGNS = new Set([
    "aries",
    "taurus",
    "gemini",
    "cancer",
    "leo",
    "virgo",
    "libra",
    "scorpio",
    "sagittarius",
    "capricorn",
    "aquarius",
    "pisces",
]);
function normalizeSign(input) {
    return String(input || "")
        .trim()
        .toLowerCase();
}
// POST /api/astrology/horoscope
router.post("/horoscope", async (req, res) => {
    try {
        const rawSign = String(req.body?.sign || "");
        const sign = normalizeSign(rawSign);
        if (!sign) {
            return res.status(400).json({ error: "Sign is required" });
        }
        if (!VALID_SIGNS.has(sign)) {
            return res.status(400).json({ error: "Invalid zodiac sign" });
        }
        const apiKey = process.env.API_NINJAS_KEY || "";
        if (!apiKey) {
            return res.status(500).json({ error: "Missing API_NINJAS_KEY" });
        }
        const url = `${API_NINJAS_URL}?zodiac=${encodeURIComponent(sign)}`;
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "X-Api-Key": apiKey,
            },
        });
        if (!response.ok) {
            const text = await response.text().catch(() => "");
            return res.status(500).json({
                error: "Failed to fetch horoscope",
                details: text || response.statusText,
            });
        }
        const data = await response.json();
        return res.json({
            sign: data?.zodiac || sign,
            message: String(data?.horoscope || "").trim(),
            date: data?.date || null,
        });
    }
    catch (error) {
        console.error("Astrology horoscope error:", error);
        return res.status(500).json({ error: "Failed to fetch horoscope" });
    }
});
exports.default = router;
//# sourceMappingURL=astrology.js.map
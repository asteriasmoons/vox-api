"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
/**
 * POST /api/books/recs
 * body: { genre: string }
 *
 * Returns: { recs: [{ title, author, summary }] }
 */
router.post("/", async (req, res) => {
    try {
        const genreRaw = String(req.body?.genre || "").trim();
        if (!genreRaw) {
            return res.status(400).json({ error: "Genre is required" });
        }
        const genre = genreRaw.slice(0, 60);
        const q = `subject:${genre}`;
        const apiKey = process.env.GOOGLE_BOOKS_API_KEY || "";
        const gbUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}` +
            `&maxResults=12&printType=books&langRestrict=en&key=${apiKey}`;
        const gbResp = await fetch(gbUrl);
        if (!gbResp.ok) {
            return res.status(500).json({ error: "Failed to fetch recommendations" });
        }
        const gb = await gbResp.json();
        const items = Array.isArray(gb?.items) ? gb.items : [];
        const recs = items
            .map((item) => {
            const info = item?.volumeInfo || {};
            const title = String(info?.title || "").trim();
            const author = Array.isArray(info?.authors)
                ? info.authors.join(", ")
                : "";
            const desc = typeof info?.description === "string" ? info.description.trim() : "";
            if (!title)
                return null;
            const summary = desc.length > 1500
                ? desc.slice(0, 1500).trim() + "…"
                : desc || "No description available.";
            return { title, author, summary };
        })
            .filter(Boolean)
            .slice(0, 10);
        return res.json({ recs });
    }
    catch (err) {
        console.error("Recommendations route error:", err);
        return res.status(500).json({ error: "Failed to fetch recommendations" });
    }
});
exports.default = router;
//# sourceMappingURL=recs.js.map
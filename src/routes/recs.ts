import { Router } from "express";
import { buildRecommendations } from "../services/recommendationEngine";
import {
  RECOMMENDATION_REQUEST_TYPES,
  type RecommendationRequestType,
} from "../types/recommendations";

const router = Router();

/**
 * POST /api/books/recs
 * body: { genre?: string, query?: string }
 *
 * Returns: { recs: [...], meta: {...} }
 */
router.post("/", async (req, res) => {
  try {
    const queryRaw = String(req.body?.query || req.body?.genre || "").trim();
    if (!queryRaw) {
      return res.status(400).json({ error: "Recommendation query is required" });
    }
    const desiredCount =
      typeof req.body?.desiredCount === "number" ? req.body.desiredCount : 30;
    const minVerifiedResults =
      typeof req.body?.minVerifiedResults === "number"
        ? req.body.minVerifiedResults
        : 12;
    const requestTypeHint =
      typeof req.body?.requestTypeHint === "string" &&
      RECOMMENDATION_REQUEST_TYPES.includes(
        req.body.requestTypeHint as RecommendationRequestType,
      )
        ? req.body.requestTypeHint
        : undefined;
    const excludeBookKeys = Array.isArray(req.body?.excludeBookKeys)
      ? req.body.excludeBookKeys.filter(
          (key: unknown): key is string => typeof key === "string",
        )
      : undefined;

    const response = await buildRecommendations({
      query: queryRaw,
      surface: "route",
      desiredCount,
      minVerifiedResults,
      ...(requestTypeHint ? { requestTypeHint } : {}),
      ...(excludeBookKeys ? { excludeBookKeys } : {}),
      ...(req.body?.readerContext ? { readerContext: req.body.readerContext } : {}),
    });

    return res.json(response);
  } catch (err) {
    console.error("Recommendations route error:", err);

    const message = err instanceof Error ? err.message : String(err);

    return res.status(500).json({
      error: "Failed to fetch recommendations",
      detail: message,
    });
  }
});

export default router;

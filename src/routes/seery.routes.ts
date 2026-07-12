import { Router, type Request, type Response } from "express";
import {
  SeeryService,
  SeeryServiceError,
  type DiscoverFilters,
} from "../services/seery.service";

const router = Router();
const seeryService = new SeeryService();

/**
 * GET /api/seery/health
 * Confirms that the Seery route module is mounted and that TMDB is configured.
 */
router.get("/health", async (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      service: "seery",
      configured: seeryService.isConfigured,
    },
  });
});

/**
 * GET /api/seery/search?query=severance&page=1
 */
router.get("/search", async (req: Request, res: Response) => {
  try {
    const query = readRequiredString(req.query.query, "query");
    const page = readPositiveInteger(req.query.page, 1);

    const data = await seeryService.searchSeries(query, page);
    res.status(200).json({ success: true, data });
  } catch (error) {
    sendError(res, error);
  }
});

/**
 * GET /api/seery/trending?window=day&page=1
 * window accepts "day" or "week".
 */
router.get("/trending", async (req: Request, res: Response) => {
  try {
    const window = req.query.window === "day" ? "day" : "week";
    const page = readPositiveInteger(req.query.page, 1);

    const data = await seeryService.getTrendingSeries(window, page);
    res.status(200).json({ success: true, data });
  } catch (error) {
    sendError(res, error);
  }
});

/**
 * GET /api/seery/discover?page=1&genre=18&status=returning&sort=popularity.desc
 */
router.get("/discover", async (req: Request, res: Response) => {
  try {
    const filters: DiscoverFilters = {
      page: readPositiveInteger(req.query.page, 1),
      sortBy: readOptionalString(req.query.sort) ?? "popularity.desc",
    };

    const genreId = readOptionalInteger(req.query.genre);
    const networkId = readOptionalInteger(req.query.network);
    const language = readOptionalString(req.query.language);
    const status = normalizeStatus(req.query.status);
    const firstAirDateFrom = readOptionalString(req.query.firstAirDateFrom);
    const firstAirDateTo = readOptionalString(req.query.firstAirDateTo);

    if (genreId !== undefined) filters.genreId = genreId;
    if (networkId !== undefined) filters.networkId = networkId;
    if (language !== undefined) filters.language = language;
    if (status !== undefined) filters.status = status;
    if (firstAirDateFrom !== undefined) {
      filters.firstAirDateFrom = firstAirDateFrom;
    }
    if (firstAirDateTo !== undefined) {
      filters.firstAirDateTo = firstAirDateTo;
    }

    const data = await seeryService.discoverSeries(filters);
    res.status(200).json({ success: true, data });
  } catch (error) {
    sendError(res, error);
  }
});

/**
 * GET /api/seery/series/:seriesId
 * Returns details, credits, external IDs, content ratings, videos,
 * recommendations, similar shows, keywords, and watch providers.
 */
router.get("/series/:seriesId", async (req: Request, res: Response) => {
  try {
    const seriesId = readId(req.params.seriesId, "seriesId");
    const region = readOptionalString(req.query.region) ?? "US";

    const data = await seeryService.getSeriesDetails(seriesId, region);
    res.status(200).json({ success: true, data });
  } catch (error) {
    sendError(res, error);
  }
});

/**
 * GET /api/seery/series/:seriesId/season/:seasonNumber
 */
router.get(
  "/series/:seriesId/season/:seasonNumber",
  async (req: Request, res: Response) => {
    try {
      const seriesId = readId(req.params.seriesId, "seriesId");
      const seasonNumber = readNonNegativeInteger(
        req.params.seasonNumber,
        "seasonNumber"
      );

      const data = await seeryService.getSeasonDetails(
        seriesId,
        seasonNumber
      );
      res.status(200).json({ success: true, data });
    } catch (error) {
      sendError(res, error);
    }
  }
);

/**
 * GET /api/seery/series/:seriesId/recommendations?page=1
 */
router.get(
  "/series/:seriesId/recommendations",
  async (req: Request, res: Response) => {
    try {
      const seriesId = readId(req.params.seriesId, "seriesId");
      const page = readPositiveInteger(req.query.page, 1);

      const data = await seeryService.getRecommendations(seriesId, page);
      res.status(200).json({ success: true, data });
    } catch (error) {
      sendError(res, error);
    }
  }
);

/**
 * GET /api/seery/series/:seriesId/providers?region=US
 */
router.get(
  "/series/:seriesId/providers",
  async (req: Request, res: Response) => {
    try {
      const seriesId = readId(req.params.seriesId, "seriesId");
      const region = readOptionalString(req.query.region) ?? "US";

      const data = await seeryService.getWatchProviders(seriesId, region);
      res.status(200).json({ success: true, data });
    } catch (error) {
      sendError(res, error);
    }
  }
);

/**
 * GET /api/seery/upcoming?startDate=2026-07-12&endDate=2026-08-12&page=1
 */
router.get("/upcoming", async (req: Request, res: Response) => {
  try {
    const startDate =
      readOptionalString(req.query.startDate) ?? toISODate(new Date());

    const defaultEnd = new Date();
    defaultEnd.setDate(defaultEnd.getDate() + 30);

    const endDate =
      readOptionalString(req.query.endDate) ?? toISODate(defaultEnd);

    const page = readPositiveInteger(req.query.page, 1);

    const data = await seeryService.getUpcomingSeries(
      startDate,
      endDate,
      page
    );
    res.status(200).json({ success: true, data });
  } catch (error) {
    sendError(res, error);
  }
});

/**
 * GET /api/seery/genres
 */
router.get("/genres", async (_req: Request, res: Response) => {
  try {
    const data = await seeryService.getGenres();
    res.status(200).json({ success: true, data });
  } catch (error) {
    sendError(res, error);
  }
});

function sendError(res: Response, error: unknown): void {
  if (error instanceof SeeryServiceError) {
    const payload: {
      success: false;
      error: {
        code: string;
        message: string;
        details?: unknown;
      };
    } = {
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    };

    if (error.details !== undefined) {
      payload.error.details = error.details;
    }

    res.status(error.statusCode).json(payload);
    return;
  }

  const message =
    error instanceof Error ? error.message : "An unexpected error occurred.";

  res.status(500).json({
    success: false,
    error: {
      code: "SEERY_INTERNAL_ERROR",
      message,
    },
  });
}

function readRequiredString(value: unknown, field: string): string {
  const parsed = readOptionalString(value);
  if (!parsed) {
    throw new SeeryServiceError(
      400,
      "SEERY_INVALID_REQUEST",
      `${field} is required.`
    );
  }
  return parsed;
}

function readOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function readPositiveInteger(value: unknown, fallback: number): number {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function readOptionalInteger(value: unknown): number | undefined {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : undefined;
}

function readId(value: unknown, field: string): number {
  const normalized = readRouteParameter(value, field);
  const parsed = Number(normalized);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new SeeryServiceError(
      400,
      "SEERY_INVALID_REQUEST",
      `${field} must be a positive integer.`
    );
  }
  return parsed;
}

function readNonNegativeInteger(value: unknown, field: string): number {
  const normalized = readRouteParameter(value, field);
  const parsed = Number(normalized);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new SeeryServiceError(
      400,
      "SEERY_INVALID_REQUEST",
      `${field} must be a non-negative integer.`
    );
  }
  return parsed;
}

function readRouteParameter(value: unknown, field: string): string {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }

  if (
    Array.isArray(value) &&
    value.length === 1 &&
    typeof value[0] === "string" &&
    value[0].trim().length > 0
  ) {
    return value[0].trim();
  }

  throw new SeeryServiceError(
    400,
    "SEERY_INVALID_REQUEST",
    `${field} is required and must be a single value.`
  );
}

function normalizeStatus(value: unknown): DiscoverFilters["status"] {
  const status = readOptionalString(value);
  const allowed = [
    "returning",
    "planned",
    "in_production",
    "ended",
    "canceled",
    "pilot",
  ] as const;

  return allowed.includes(status as (typeof allowed)[number])
    ? (status as DiscoverFilters["status"])
    : undefined;
}

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default router;

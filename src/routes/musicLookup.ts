import { Router } from "express";
import { lookupTrackMetadata } from "../services/trackLookupService.js";

const router = Router();

router.post("/lookup", async (req, res) => {
  try {
    const title = String(req.body?.title || "").trim();
    const artist = String(req.body?.artist || "").trim();

    if (!title) {
      return res.status(400).json({ error: "Track title is required" });
    }

    const metadata = await lookupTrackMetadata(title, artist);

    if (!metadata) {
      return res.status(404).json({
        error: "No metadata found",
        title,
        artist,
      });
    }

    return res.json({ track: metadata });
  } catch (error) {
    console.error("Music lookup route error:", error);

    return res.status(500).json({
      error: "Failed to look up track metadata",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
});

router.post("/lookup/batch", async (req, res) => {
  try {
    const tracks = req.body?.tracks;

    if (!Array.isArray(tracks) || tracks.length === 0) {
      return res.status(400).json({
        error: "Request body must include a non-empty 'tracks' array",
      });
    }

    const capped = tracks.slice(0, 20);

    const results = await Promise.all(
      capped.map(async (entry: unknown) => {
        const item = entry as { title?: string; artist?: string } | undefined;
        const title = String(item?.title || "").trim();
        const artist = String(item?.artist || "").trim();

        if (!title) return { title, artist, metadata: null };

        const metadata = await lookupTrackMetadata(title, artist).catch(
          () => null,
        );

        return { title, artist, metadata };
      }),
    );

    return res.json({ results });
  } catch (error) {
    console.error("Music batch lookup route error:", error);

    return res.status(500).json({
      error: "Failed to look up track metadata",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;

import { Router, Request, Response } from "express";
import {
  ChallengeAIValidationPacket,
  ChallengeAIValidationResponse,
  validateLumeyChallengeTheme,
} from "../services/lumeyChallengeThemeValidationService";

const router = Router();

router.post(
  "/validate-theme",
  async (
    req: Request<
      {},
      ChallengeAIValidationResponse,
      ChallengeAIValidationPacket
    >,
    res: Response<ChallengeAIValidationResponse>,
  ) => {
    try {
      const packet = req.body;

      if (!packet.challengeTitle || typeof packet.challengeTitle !== "string") {
        return res.status(400).json({
          status: "needsMoreInfo",
          message: "Challenge title is required.",
        });
      }

      if (
        !packet.requirementText ||
        typeof packet.requirementText !== "string"
      ) {
        return res.status(400).json({
          status: "needsMoreInfo",
          message: "Challenge requirement is required.",
        });
      }

      if (!Array.isArray(packet.bookTitles) || packet.bookTitles.length === 0) {
        return res.status(400).json({
          status: "needsMoreInfo",
          message: "At least one linked book is required for validation.",
        });
      }

      const result = await validateLumeyChallengeTheme(packet);

      return res.status(200).json(result);
    } catch (error) {
      console.error("[lumey-challenges] Theme validation failed:", error);

      return res.status(500).json({
        status: "needsMoreInfo",
        message:
          "Lumey could not validate this challenge right now. Please try again soon.",
      });
    }
  },
);

export default router;

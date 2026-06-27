import { Router, Request, Response } from "express";
import {
  createSubmission,
  createFeedPost,
  uploadFeedPhoto,
  approveSubmissionAndPostToFeed,
  getChallengeFeed,
  toggleFeedItemLike,
  addFeedItemComment,
  deleteComment,
  getUserProfile,
  updateUserProfile,
} from "../services/lumeyChallengeSocialService";

const router = Router();

/**
 * GET /api/lumey/challenges/feed
 */
router.get("/feed", async (_req: Request, res: Response) => {
  try {
    const feed = await getChallengeFeed();

    return res.status(200).json(feed);
  } catch (error) {
    console.error("[lumey-challenges] feed:", error);

    return res.status(500).json({
      message: "Unable to load the challenge feed.",
    });
  }
});

/**
 * POST /api/lumey/challenges/submissions
 */
router.post("/submissions", async (req: Request, res: Response) => {
  try {
    const submission = await createSubmission(req.body);

    return res.status(201).json(submission);
  } catch (error: any) {
    console.error("[lumey-challenges] create submission:", error);

    return res.status(400).json({
      message: error?.message ?? "Unable to create submission.",
    });
  }
});

/**
 * POST /api/lumey/challenges/submissions/:submissionID/approve
 * Approves a challenge submission and automatically posts it to the feed.
 */
router.post(
  "/submissions/:submissionID/approve",
  async (req: Request, res: Response) => {
    try {
      const submissionID = String(req.params.submissionID || "").trim();

      if (!submissionID) {
        return res.status(400).json({
          message: "submissionID is required.",
        });
      }

      const result = await approveSubmissionAndPostToFeed({
        submissionID,
        validationMessage: req.body.validationMessage,
        challengeTitle: req.body.challengeTitle,
      });

      return res.status(200).json(result);
    } catch (error: any) {
      console.error("[lumey-challenges] approve submission:", error);

      return res.status(400).json({
        message: error?.message ?? "Unable to approve submission.",
      });
    }
  },
);

/**
 * POST /api/lumey/challenges/feed/posts
 * Creates a normal user post and adds it to the feed.
 */
router.post("/feed/posts", async (req: Request, res: Response) => {
  try {
    const feedItem = await createFeedPost(req.body);

    return res.status(201).json(feedItem);
  } catch (error: any) {
    console.error("[lumey-challenges] create feed post:", error);

    return res.status(400).json({
      message: error?.message ?? "Unable to create feed post.",
    });
  }
});

/**
 * POST /api/lumey/challenges/feed/upload-photo
 * Uploads a feed photo and returns the stored image string.
 */
router.post("/feed/upload-photo", async (req: Request, res: Response) => {
  try {
    const result = await uploadFeedPhoto({
      imageBase64: req.body.imageBase64,
    });

    return res.status(201).json(result);
  } catch (error: any) {
    console.error("[lumey-challenges] upload feed photo:", error);

    return res.status(400).json({
      message: error?.message ?? "Unable to upload feed photo.",
    });
  }
});

/**
 * POST /api/lumey/challenges/feed/items/:feedItemID/like
 */
router.post(
  "/feed/items/:feedItemID/like",
  async (req: Request, res: Response) => {
    try {
      const feedItemID = String(req.params.feedItemID || "").trim();

      if (!feedItemID) {
        return res.status(400).json({
          message: "feedItemID is required.",
        });
      }

      const result = await toggleFeedItemLike({
        feedItemID,
        userID: req.body.userID,
      });

      return res.status(200).json(result);
    } catch (error: any) {
      console.error("[lumey-challenges] like feed item:", error);

      return res.status(400).json({
        message: error?.message ?? "Unable to update like.",
      });
    }
  },
);

/**
 * POST /api/lumey/challenges/feed/items/:feedItemID/comments
 */
router.post(
  "/feed/items/:feedItemID/comments",
  async (req: Request, res: Response) => {
    try {
      const feedItemID = String(req.params.feedItemID || "").trim();

      if (!feedItemID) {
        return res.status(400).json({
          message: "feedItemID is required.",
        });
      }

      const comment = await addFeedItemComment({
        feedItemID,
        userID: req.body.userID,
        username: req.body.username,
        avatarName: req.body.avatarName,
        avatarURL: req.body.avatarURL,
        text: req.body.text,
      });

      return res.status(201).json(comment);
    } catch (error: any) {
      console.error("[lumey-challenges] add feed item comment:", error);

      return res.status(400).json({
        message: error?.message ?? "Unable to add comment.",
      });
    }
  },
);

/**
 * DELETE /api/lumey/challenges/comments/:commentID
 */
router.delete("/comments/:commentID", async (req: Request, res: Response) => {
  try {
    const commentID = String(req.params.commentID || "").trim();

    if (!commentID) {
      return res.status(400).json({
        message: "commentID is required.",
      });
    }

    await deleteComment(commentID);

    return res.sendStatus(204);
  } catch (error: any) {
    console.error("[lumey-challenges] delete comment:", error);

    return res.status(400).json({
      message: error?.message ?? "Unable to delete comment.",
    });
  }
});

/**
 * GET /api/lumey/challenges/profiles/:userID
 */
router.get("/profiles/:userID", async (req: Request, res: Response) => {
  try {
    const userID = String(req.params.userID || "").trim();

    if (!userID) {
      return res.status(400).json({
        message: "userID is required.",
      });
    }

    const profile = await getUserProfile(userID);

    return res.status(200).json(profile);
  } catch (error: any) {
    console.error("[lumey-challenges] profile:", error);

    return res.status(404).json({
      message: error?.message ?? "Profile not found.",
    });
  }
});

/**
 * PUT /api/lumey/challenges/profiles/:userID
 */
router.put("/profiles/:userID", async (req: Request, res: Response) => {
  try {
    const userID = String(req.params.userID || "").trim();

    if (!userID) {
      return res.status(400).json({
        message: "userID is required.",
      });
    }

    const profile = await updateUserProfile(userID, req.body);

    return res.status(200).json(profile);
  } catch (error: any) {
    console.error("[lumey-challenges] update profile:", error);

    return res.status(400).json({
      message: error?.message ?? "Unable to update profile.",
    });
  }
});

export default router;

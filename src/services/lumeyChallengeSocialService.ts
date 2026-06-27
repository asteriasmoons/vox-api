import { LumeyChallengeSubmission } from "../models/lumeyChallengeSubmission";
import { LumeyChallengeComment } from "../models/lumeyChallengeComment";
import { LumeyChallengeLike } from "../models/lumeyChallengeLike";
import { LumeyChallengeProfile } from "../models/lumeyChallengeProfile";
import { LumeyChallengeFeedItem } from "../models/lumeyChallengeFeedItem";
import { LumeyChallengePost } from "../models/lumeyChallengePost";

export async function getChallengeFeed() {
  const feedItems = await LumeyChallengeFeedItem.find()
    .sort({ createdDate: -1 })
    .lean();

  const submissions = await LumeyChallengeSubmission.find()
    .sort({ submittedDate: -1 })
    .lean();

  const posts = await LumeyChallengePost.find({ isDeleted: false })
    .sort({ createdDate: -1 })
    .lean();

  const comments = await LumeyChallengeComment.find()
    .sort({ createdDate: 1 })
    .lean();

  const likes = await LumeyChallengeLike.find()
    .sort({ createdDate: -1 })
    .lean();

  const profiles = await LumeyChallengeProfile.find()
    .sort({ username: 1 })
    .lean();

  return {
    feedItems,
    submissions,
    posts,
    comments,
    likes,
    profiles,
  };
}

export async function createSubmission(input: any) {
  if (!input.challengeID) throw new Error("challengeID is required.");
  if (!input.userID) throw new Error("userID is required.");

  const validationStatus = cleanString(input.validationStatus) || "submitted";

  const submission = await LumeyChallengeSubmission.create({
    challengeID: input.challengeID,
    entryID: input.entryID ?? "",
    userID: input.userID,
    username: cleanString(input.username) || "Reader",
    linkedBookIDs: cleanStringArray(input.linkedBookIDs),
    linkedSessionIDs: cleanStringArray(input.linkedSessionIDs),
    linkedReviewIDs: cleanStringArray(input.linkedReviewIDs),
    linkedReadingListIDs: cleanStringArray(input.linkedReadingListIDs),
    submissionNote: cleanString(input.submissionNote),
    proofSummary: cleanString(input.proofSummary),
    validationStatus,
    validationMessage: cleanString(input.validationMessage),
    submittedDate: input.submittedDate
      ? new Date(input.submittedDate)
      : new Date(),
    approvedDate: input.approvedDate ? new Date(input.approvedDate) : undefined,
    postedToFeed: false,
    feedItemID: null,
    likeCount: 0,
    commentCount: 0,
  });

  await ensureProfile({
    userID: submission.userID,
    username: submission.username,
  });

  if (validationStatus === "approved") {
    return approveSubmissionAndPostToFeed({
      submissionID: String(submission._id),
      validationMessage: submission.validationMessage,
      challengeTitle: cleanString(input.challengeTitle),
    });
  }

  return submission;
}

export async function approveSubmissionAndPostToFeed(input: {
  submissionID: string;
  validationMessage?: string;
  challengeTitle?: string;
}) {
  if (!input.submissionID) throw new Error("submissionID is required.");

  const submission = await LumeyChallengeSubmission.findById(input.submissionID);
  if (!submission) throw new Error("Submission not found.");

  submission.validationStatus = "approved";
  submission.validationMessage = cleanString(input.validationMessage) || submission.validationMessage;
  submission.approvedDate = new Date();

  if (submission.postedToFeed && submission.feedItemID) {
    await submission.save();

    const existingFeedItem = await LumeyChallengeFeedItem.findById(submission.feedItemID);

    return {
      submission,
      feedItem: existingFeedItem,
    };
  }

  const feedItem = await LumeyChallengeFeedItem.create({
    feedType: "submission",
    submissionID: submission._id,
    postID: null,
    userID: submission.userID,
    username: submission.username,
    challengeID: submission.challengeID,
    challengeTitle: cleanString(input.challengeTitle),
    text: submission.submissionNote || submission.proofSummary || "Challenge submission approved.",
    photoURL: "",
    likeCount: 0,
    commentCount: 0,
    createdDate: submission.approvedDate,
  });

  submission.postedToFeed = true;
  submission.feedItemID = feedItem._id;
  await submission.save();

  await ensureProfile({
    userID: submission.userID,
    username: submission.username,
  });

  return {
    submission,
    feedItem,
  };
}

export async function uploadFeedPhoto(input: { imageBase64: string }) {
  const imageBase64 = cleanString(input.imageBase64);

  if (!imageBase64) {
    throw new Error("imageBase64 is required.");
  }

  if (!isLikelyImageBase64(imageBase64)) {
    throw new Error("Invalid image data.");
  }

  return {
    photoBase64: imageBase64,
  };
}

export async function createFeedPost(input: any) {
  if (!input.userID) throw new Error("userID is required.");

  const text = cleanString(input.text);
  const photoURL = cleanString(input.photoURL);
  const photoBase64 = cleanString(input.photoBase64);

  if (!text && !photoURL && !photoBase64) {
    throw new Error("A feed post needs text, a photo, or both.");
  }

  const username = cleanString(input.username) || "Reader";

  const post = await LumeyChallengePost.create({
    userID: input.userID,
    username,
    text,
    photoURL,
    photoBase64,
    photoCaption: cleanString(input.photoCaption),
    linkedBookID: cleanString(input.linkedBookID),
    linkedChallengeID: cleanString(input.linkedChallengeID),
    mood: cleanString(input.mood),
    containsSpoilers: Boolean(input.containsSpoilers),
    visibility: input.visibility === "followers" ? "followers" : "public",
    createdDate: new Date(),
    editedDate: null,
    isEdited: false,
    isDeleted: false,
  });

  const feedItem = await LumeyChallengeFeedItem.create({
    feedType: "post",
    submissionID: null,
    postID: post._id,
    userID: post.userID,
    username: post.username,
    challengeID: post.linkedChallengeID,
    challengeTitle: "",
    text: post.text,
    photoURL: post.photoURL,
    photoBase64: post.photoBase64,
    likeCount: 0,
    commentCount: 0,
    createdDate: post.createdDate,
  });

  await ensureProfile({
    userID: post.userID,
    username: post.username,
  });

  return feedItem;
}

export async function toggleFeedItemLike(input: {
  feedItemID: string;
  userID: string;
}) {
  if (!input.feedItemID) throw new Error("feedItemID is required.");
  if (!input.userID) throw new Error("userID is required.");

  const feedItem = await LumeyChallengeFeedItem.findById(input.feedItemID);
  if (!feedItem) throw new Error("Feed item not found.");

  const existingLike = await LumeyChallengeLike.findOne({
    feedItemID: input.feedItemID,
    userID: input.userID,
  });

  if (existingLike) {
    await existingLike.deleteOne();

    feedItem.likeCount = Math.max(0, feedItem.likeCount - 1);
    await feedItem.save();

    return {
      liked: false,
      likeCount: feedItem.likeCount,
    };
  }

  await LumeyChallengeLike.create({
    feedItemID: input.feedItemID,
    userID: input.userID,
    createdDate: new Date(),
  });

  feedItem.likeCount += 1;
  await feedItem.save();

  return {
    liked: true,
    likeCount: feedItem.likeCount,
  };
}

export async function addFeedItemComment(input: {
  feedItemID: string;
  userID: string;
  username?: string;
  avatarName?: string;
  avatarURL?: string;
  text: string;
}) {
  if (!input.feedItemID) throw new Error("feedItemID is required.");
  if (!input.userID) throw new Error("userID is required.");

  const text = cleanString(input.text);
  if (!text) throw new Error("Comment text is required.");

  const feedItem = await LumeyChallengeFeedItem.findById(input.feedItemID);
  if (!feedItem) throw new Error("Feed item not found.");

  const username = cleanString(input.username) || "Reader";

  const comment = await LumeyChallengeComment.create({
    feedItemID: input.feedItemID,
    userID: input.userID,
    username,
    avatarName: cleanString(input.avatarName),
    avatarURL: cleanString(input.avatarURL),
    text,
    createdDate: new Date(),
  });

  feedItem.commentCount += 1;
  await feedItem.save();

  await ensureProfile({
    userID: comment.userID,
    username: comment.username,
  });

  return comment;
}

export async function deleteComment(commentID: string) {
  if (!commentID) throw new Error("commentID is required.");

  const comment = await LumeyChallengeComment.findById(commentID);
  if (!comment) throw new Error("Comment not found.");

  const feedItem = await LumeyChallengeFeedItem.findById(comment.feedItemID);

  await comment.deleteOne();

  if (feedItem) {
    feedItem.commentCount = Math.max(0, feedItem.commentCount - 1);
    await feedItem.save();
  }

  return {
    deleted: true,
  };
}

export async function getUserProfile(userID: string) {
  if (!userID) throw new Error("userID is required.");

  const existing = await LumeyChallengeProfile.findOne({ userID });

  if (existing) return existing;

  return ensureProfile({
    userID,
    username: "Reader",
  });
}

export async function updateUserProfile(userID: string, input: any) {
  if (!userID) throw new Error("userID is required.");

  const profile = await ensureProfile({
    userID,
    username: cleanString(input.username) || "Reader",
  });

  profile.username = cleanString(input.username) || profile.username;
  profile.avatarName = cleanString(input.avatarName) || profile.avatarName;
  profile.bio = cleanString(input.bio) || profile.bio;
  profile.favoriteGenre = cleanString(input.favoriteGenre) || profile.favoriteGenre;

  if (typeof input.readingStreak === "number") {
    profile.readingStreak = input.readingStreak;
  }

  if (typeof input.challengePoints === "number") {
    profile.challengePoints = input.challengePoints;
  }

  if (typeof input.challengesCompleted === "number") {
    profile.challengesCompleted = input.challengesCompleted;
  }

  if (typeof input.followersCount === "number") {
    profile.followersCount = input.followersCount;
  }

  if (typeof input.followingCount === "number") {
    profile.followingCount = input.followingCount;
  }

  await profile.save();

  return profile;
}

async function ensureProfile(input: { userID: string; username: string }) {
  const existing = await LumeyChallengeProfile.findOne({
    userID: input.userID,
  });

  if (existing) {
    if (input.username.trim()) {
      existing.username = input.username.trim();
      await existing.save();
    }

    return existing;
  }

  return LumeyChallengeProfile.create({
    userID: input.userID,
    username: input.username.trim() || "Reader",
    avatarName: "",
    bio: "",
    favoriteGenre: "",
    readingStreak: 0,
    challengePoints: 0,
    challengesCompleted: 0,
    followersCount: 0,
    followingCount: 0,
  });
}

function cleanString(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

function cleanStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function isLikelyImageBase64(value: string): boolean {
  if (!value) return false;

  if (value.startsWith("data:image/")) {
    return value.includes(";base64,");
  }

  return /^[A-Za-z0-9+/=]+$/.test(value);
}

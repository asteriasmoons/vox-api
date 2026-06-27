import mongoose from "mongoose";

const lumeyChallengeCommentSchema = new mongoose.Schema(
  {
    feedItemID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LumeyChallengeFeedItem",
      required: true,
      index: true,
    },

    userID: {
      type: String,
      required: true,
    },

    username: {
      type: String,
      required: true,
    },

    avatarName: {
      type: String,
      default: "",
      trim: true,
    },

    avatarURL: {
      type: String,
      default: "",
      trim: true,
    },

    text: {
      type: String,
      required: true,
      trim: true,
    },

    createdDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

lumeyChallengeCommentSchema.index({ feedItemID: 1, createdDate: 1 });

export const LumeyChallengeComment = mongoose.model(
  "LumeyChallengeComment",
  lumeyChallengeCommentSchema,
);

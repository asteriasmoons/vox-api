import mongoose from "mongoose";

const lumeyChallengeLikeSchema = new mongoose.Schema(
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

    createdDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

lumeyChallengeLikeSchema.index(
  {
    feedItemID: 1,
    userID: 1,
  },
  {
    unique: true,
  },
);

export const LumeyChallengeLike = mongoose.model(
  "LumeyChallengeLike",
  lumeyChallengeLikeSchema,
);

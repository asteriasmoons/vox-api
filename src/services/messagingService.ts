// import { LumeyConversation } from "../models/conversation";
// import { LumeyDirectMessage } from "../models/directMessage";
// import { LumeyChallengeFollow } from "../models/challengeFollow";
// import { LumeyChallengeProfile } from "../models/challengeProfile";

import type { Model } from "mongoose";

import { LumeyConversation as LumeyConversationRaw } from "../models/conversation";
import { LumeyDirectMessage as LumeyDirectMessageRaw } from "../models/directMessage";
import { LumeyChallengeFollow as LumeyChallengeFollowRaw } from "../models/challengeFollow";
import { LumeyChallengeProfile as LumeyChallengeProfileRaw } from "../models/challengeProfile";

const LumeyConversation = LumeyConversationRaw as Model<any>;
const LumeyDirectMessage = LumeyDirectMessageRaw as Model<any>;
const LumeyChallengeFollow = LumeyChallengeFollowRaw as Model<any>;
const LumeyChallengeProfile = LumeyChallengeProfileRaw as Model<any>;

/**
 * Returns the sorted participant pair so (A, B) and (B, A) always
 * resolve to the same conversation document.
 */
function sortedPair(
  userA: string,
  userB: string,
): { participantA: string; participantB: string } {
  return userA < userB
    ? { participantA: userA, participantB: userB }
    : { participantA: userB, participantB: userA };
}

// ─── Conversations ───────────────────────────────────────────────

export async function getConversations(userID: string) {
  if (!userID) throw new Error("userID is required.");

  const conversations = await LumeyConversation.find({
    $or: [{ participantA: userID }, { participantB: userID }],
  })
    .sort({ lastMessageDate: -1 })
    .lean();

  return conversations;
}

export async function getOrCreateConversation(input: {
  senderUserID: string;
  senderUsername: string;
  recipientUserID: string;
  recipientUsername: string;
}) {
  if (!input.senderUserID) throw new Error("senderUserID is required.");
  if (!input.recipientUserID) throw new Error("recipientUserID is required.");

  // Skip follow check for self-conversations (useful for testing)
  if (input.senderUserID !== input.recipientUserID) {
    const followExists = await LumeyChallengeFollow.findOne({
      $or: [
        {
          followerUserID: input.senderUserID,
          followingUserID: input.recipientUserID,
        },
        {
          followerUserID: input.recipientUserID,
          followingUserID: input.senderUserID,
        },
      ],
    });

    if (!followExists) {
      throw new Error(
        "You can only message users you follow or who follow you.",
      );
    }
  }

  const { participantA, participantB } = sortedPair(
    input.senderUserID,
    input.recipientUserID,
  );

  const existing = await LumeyConversation.findOne({
    participantA,
    participantB,
  });

  if (existing) return existing;

  // Resolve usernames via sorted order
  const usernameA =
    participantA === input.senderUserID
      ? input.senderUsername
      : input.recipientUsername;

  const usernameB =
    participantB === input.senderUserID
      ? input.senderUsername
      : input.recipientUsername;

  const conversation = await LumeyConversation.create({
    participantA,
    participantB,
    participantAUsername: cleanString(usernameA) || "Reader",
    participantBUsername: cleanString(usernameB) || "Reader",
    lastMessageText: "",
    lastMessageSenderUserID: "",
    lastMessageDate: new Date(),
    unreadCountA: 0,
    unreadCountB: 0,
  });

  return conversation;
}

// ─── Messages ────────────────────────────────────────────────────

export async function getMessages(conversationID: string, userID: string) {
  if (!conversationID) throw new Error("conversationID is required.");
  if (!userID) throw new Error("userID is required.");

  const conversation = await LumeyConversation.findById(conversationID);
  if (!conversation) throw new Error("Conversation not found.");

  // Verify caller is a participant
  if (
    conversation.participantA !== userID &&
    conversation.participantB !== userID
  ) {
    throw new Error("You are not a participant in this conversation.");
  }

  const messages = await LumeyDirectMessage.find({ conversationID })
    .sort({ createdDate: 1 })
    .lean();

  return messages;
}

export async function sendMessage(input: {
  conversationID: string;
  senderUserID: string;
  senderUsername: string;
  text: string;
}) {
  if (!input.conversationID) throw new Error("conversationID is required.");
  if (!input.senderUserID) throw new Error("senderUserID is required.");

  const text = cleanString(input.text);
  if (!text) throw new Error("Message text is required.");

  const conversation = await LumeyConversation.findById(input.conversationID);
  if (!conversation) throw new Error("Conversation not found.");

  // Verify sender is a participant
  if (
    conversation.participantA !== input.senderUserID &&
    conversation.participantB !== input.senderUserID
  ) {
    throw new Error("You are not a participant in this conversation.");
  }

  const message = await LumeyDirectMessage.create({
    conversationID: input.conversationID,
    senderUserID: input.senderUserID,
    senderUsername: cleanString(input.senderUsername) || "Reader",
    text,
    isRead: false,
    createdDate: new Date(),
  });

  // Update conversation preview
  conversation.lastMessageText =
    text.length > 100 ? text.substring(0, 100) + "…" : text;
  conversation.lastMessageSenderUserID = input.senderUserID;
  conversation.lastMessageDate = message.createdDate;

  // Increment unread for the other participant
  if (conversation.participantA === input.senderUserID) {
    conversation.unreadCountB += 1;
  } else {
    conversation.unreadCountA += 1;
  }

  await conversation.save();

  return message;
}

export async function markMessagesRead(
  conversationID: string,
  readerUserID: string,
) {
  if (!conversationID) throw new Error("conversationID is required.");
  if (!readerUserID) throw new Error("readerUserID is required.");

  const conversation = await LumeyConversation.findById(conversationID);
  if (!conversation) throw new Error("Conversation not found.");

  if (
    conversation.participantA !== readerUserID &&
    conversation.participantB !== readerUserID
  ) {
    throw new Error("You are not a participant in this conversation.");
  }

  // Mark all messages from the other user as read
  await LumeyDirectMessage.updateMany(
    {
      conversationID,
      senderUserID: { $ne: readerUserID },
      isRead: false,
    },
    { $set: { isRead: true } },
  );

  // Reset unread count for reader
  if (conversation.participantA === readerUserID) {
    conversation.unreadCountA = 0;
  } else {
    conversation.unreadCountB = 0;
  }

  await conversation.save();

  return { marked: true };
}

export async function getMessageableUsers(userID: string) {
  if (!userID) throw new Error("userID is required.");

  // Users who the current user follows or who follow the current user
  const follows = await LumeyChallengeFollow.find({
    $or: [{ followerUserID: userID }, { followingUserID: userID }],
  }).lean();

  const connectedUserIDs = new Set<string>();

  // Always include yourself so you can message yourself.
  connectedUserIDs.add(userID);

  for (const follow of follows) {
    if (follow.followerUserID !== userID) {
      connectedUserIDs.add(follow.followerUserID);
    }
    if (follow.followingUserID !== userID) {
      connectedUserIDs.add(follow.followingUserID);
    }
  }

  if (connectedUserIDs.size === 0) return [];

  const profiles = await LumeyChallengeProfile.find({
    userID: { $in: Array.from(connectedUserIDs) },
  })
    .sort({ username: 1 })
    .lean();

  const me = profiles.find((profile) => profile.userID === userID);
  const others = profiles.filter((profile) => profile.userID !== userID);

  return me ? [me, ...others] : others;
}

// ─── Helpers ─────────────────────────────────────────────────────

function cleanString(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

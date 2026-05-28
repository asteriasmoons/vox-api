"use strict";
// src/services/buddy-service.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.postAnnouncement = postAnnouncement;
exports.getBoard = getBoard;
exports.getMyAnnouncements = getMyAnnouncements;
exports.removeAnnouncement = removeAnnouncement;
exports.updateAnnouncement = updateAnnouncement;
exports.requestToJoin = requestToJoin;
exports.respondToJoinRequest = respondToJoinRequest;
exports.leaveGroup = leaveGroup;
exports.getGroup = getGroup;
exports.getMyGroup = getMyGroup;
exports.sendMessage = sendMessage;
exports.getMessages = getMessages;
const BuddyAnnouncement_1 = require("../models/BuddyAnnouncement");
const BuddyGroup_1 = require("../models/BuddyGroup");
const BuddyMessage_1 = require("../models/BuddyMessage");
// 30 days TTL for announcements
const ANNOUNCEMENT_TTL_MS = 30 * 24 * 60 * 60 * 1000;
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function assertMember(group, userId) {
    const member = group.members.find((m) => m.userId === userId);
    if (!member || member.status === "left")
        throw new Error("NOT_A_MEMBER");
    return member;
}
function activeJoinedCount(group) {
    return group.members.filter((m) => m.status === "joined").length;
}
// ---------------------------------------------------------------------------
// Announcement board
// ---------------------------------------------------------------------------
async function postAnnouncement(input) {
    const activeCount = await BuddyAnnouncement_1.BuddyAnnouncement.countDocuments({
        ownerUserId: input.ownerUserId,
        isActive: true,
    });
    if (activeCount >= 3) {
        throw new Error("ANNOUNCEMENT_LIMIT_REACHED");
    }
    const expiresAt = new Date(Date.now() + ANNOUNCEMENT_TTL_MS);
    const announcement = await BuddyAnnouncement_1.BuddyAnnouncement.create({
        ownerUserId: input.ownerUserId,
        ownerDisplayName: input.ownerDisplayName,
        bookTitle: input.bookTitle,
        bookAuthor: input.bookAuthor ?? null,
        bookCoverUrl: input.bookCoverUrl ?? null,
        bookKey: input.bookKey ?? null,
        message: input.message ?? null,
        currentChapter: input.currentChapter ?? null,
        currentPage: input.currentPage ?? null,
        maxMembers: input.maxMembers ?? 2,
        isActive: true,
        expiresAt,
    });
    return announcement;
}
async function getBoard(currentUserId) {
    const now = new Date();
    BuddyAnnouncement_1.BuddyAnnouncement.updateMany({ isActive: true, expiresAt: { $lt: now } }, { isActive: false }).catch(() => { });
    return BuddyAnnouncement_1.BuddyAnnouncement.find({
        isActive: true,
        expiresAt: { $gte: now },
    }).sort({ createdAt: -1 });
}
async function getMyAnnouncements(ownerUserId) {
    return BuddyAnnouncement_1.BuddyAnnouncement.find({ ownerUserId, isActive: true }).sort({ createdAt: -1 });
}
async function removeAnnouncement(announcementId, ownerUserId) {
    const announcement = await BuddyAnnouncement_1.BuddyAnnouncement.findById(announcementId);
    if (!announcement)
        throw new Error("ANNOUNCEMENT_NOT_FOUND");
    if (announcement.ownerUserId !== ownerUserId)
        throw new Error("FORBIDDEN");
    announcement.isActive = false;
    await announcement.save();
}
async function updateAnnouncement(input) {
    const announcement = await BuddyAnnouncement_1.BuddyAnnouncement.findById(input.announcementId);
    if (!announcement)
        throw new Error("ANNOUNCEMENT_NOT_FOUND");
    if (announcement.ownerUserId !== input.ownerUserId)
        throw new Error("FORBIDDEN");
    if (typeof input.message !== "undefined")
        announcement.message = input.message;
    if (typeof input.currentChapter !== "undefined")
        announcement.currentChapter = input.currentChapter;
    if (typeof input.currentPage !== "undefined")
        announcement.currentPage = input.currentPage;
    if (typeof input.maxMembers !== "undefined")
        announcement.maxMembers = input.maxMembers;
    await announcement.save();
    return announcement;
}
// ---------------------------------------------------------------------------
// Group & join flow
// ---------------------------------------------------------------------------
async function requestToJoin(input, io) {
    const announcement = await BuddyAnnouncement_1.BuddyAnnouncement.findById(input.announcementId);
    if (!announcement || !announcement.isActive)
        throw new Error("ANNOUNCEMENT_NOT_FOUND");
    let group = await BuddyGroup_1.BuddyGroup.findOne({ announcementId: input.announcementId });
    if (!group) {
        group = await BuddyGroup_1.BuddyGroup.create({
            announcementId: String(announcement._id),
            bookTitle: announcement.bookTitle,
            bookAuthor: announcement.bookAuthor,
            bookCoverUrl: announcement.bookCoverUrl,
            bookKey: announcement.bookKey,
            maxMembers: announcement.maxMembers,
            members: [
                {
                    userId: announcement.ownerUserId,
                    displayName: announcement.ownerDisplayName,
                    status: "joined",
                    isOwner: true,
                    joinedAt: announcement.createdAt,
                    requestedAt: announcement.createdAt,
                },
            ],
            isActive: true,
        });
        announcement.groupId = String(group._id);
        await announcement.save();
    }
    // If requester is already a joined member (e.g. the owner joining their own
    // announcement during testing), just return the group directly
    const existing = group.members.find((m) => m.userId === input.requesterUserId);
    if (existing) {
        if (existing.status === "joined")
            return group;
        if (existing.status === "pending")
            throw new Error("REQUEST_ALREADY_SENT");
        // status === "left" — allow re-request
        existing.status = "pending";
        existing.requestedAt = new Date();
        existing.joinedAt = null;
    }
    else {
        const joinedCount = activeJoinedCount(group);
        if (joinedCount >= group.maxMembers)
            throw new Error("GROUP_FULL");
        group.members.push({
            userId: input.requesterUserId,
            displayName: input.requesterDisplayName,
            status: "pending",
            isOwner: false,
            joinedAt: null,
            requestedAt: new Date(),
        });
    }
    await group.save();
    io.to(String(group._id)).emit("buddy:join_request", {
        groupId: String(group._id),
        requesterUserId: input.requesterUserId,
        requesterDisplayName: input.requesterDisplayName,
    });
    return group;
}
async function respondToJoinRequest(input, io) {
    const group = await BuddyGroup_1.BuddyGroup.findById(input.groupId);
    if (!group || !group.isActive)
        throw new Error("GROUP_NOT_FOUND");
    const actor = group.members.find((m) => m.userId === input.actorUserId);
    if (!actor || !actor.isOwner)
        throw new Error("FORBIDDEN");
    const target = group.members.find((m) => m.userId === input.targetUserId);
    if (!target || target.status !== "pending")
        throw new Error("REQUEST_NOT_FOUND");
    if (input.accept) {
        const joinedCount = activeJoinedCount(group);
        if (joinedCount >= group.maxMembers)
            throw new Error("GROUP_FULL");
        target.status = "joined";
        target.joinedAt = new Date();
        const newJoinedCount = activeJoinedCount(group);
        if (newJoinedCount >= group.maxMembers) {
            await BuddyAnnouncement_1.BuddyAnnouncement.findByIdAndUpdate(group.announcementId, {
                isActive: false,
            });
        }
        await BuddyMessage_1.BuddyMessage.create({
            groupId: String(group._id),
            senderUserId: "system",
            senderDisplayName: "system",
            type: "system",
            text: `${target.displayName} joined the group.`,
        });
        io.to(String(group._id)).emit("buddy:member_joined", {
            groupId: String(group._id),
            userId: target.userId,
            displayName: target.displayName,
        });
    }
    else {
        target.status = "left";
        io.to(String(group._id)).emit("buddy:join_declined", {
            groupId: String(group._id),
            userId: target.userId,
        });
    }
    await group.save();
    return group;
}
async function leaveGroup(input, io) {
    const group = await BuddyGroup_1.BuddyGroup.findById(input.groupId);
    if (!group || !group.isActive)
        throw new Error("GROUP_NOT_FOUND");
    const member = assertMember(group, input.userId);
    member.status = "left";
    member.joinedAt = null;
    if (member.isOwner) {
        const nextOwner = group.members.find((m) => m.userId !== input.userId && m.status === "joined");
        if (nextOwner) {
            nextOwner.isOwner = true;
            await BuddyAnnouncement_1.BuddyAnnouncement.findByIdAndUpdate(group.announcementId, {
                isActive: true,
                ownerUserId: nextOwner.userId,
                ownerDisplayName: nextOwner.displayName,
                expiresAt: new Date(Date.now() + ANNOUNCEMENT_TTL_MS),
            });
        }
        else {
            group.isActive = false;
            await BuddyAnnouncement_1.BuddyAnnouncement.findByIdAndUpdate(group.announcementId, {
                isActive: false,
            });
        }
    }
    else {
        const joinedCount = activeJoinedCount(group);
        if (joinedCount < group.maxMembers) {
            await BuddyAnnouncement_1.BuddyAnnouncement.findByIdAndUpdate(group.announcementId, {
                isActive: true,
                expiresAt: new Date(Date.now() + ANNOUNCEMENT_TTL_MS),
            });
        }
    }
    await BuddyMessage_1.BuddyMessage.create({
        groupId: String(group._id),
        senderUserId: "system",
        senderDisplayName: "system",
        type: "system",
        text: `${member.displayName} left the group.`,
    });
    await group.save();
    io.to(String(group._id)).emit("buddy:member_left", {
        groupId: String(group._id),
        userId: input.userId,
        displayName: member.displayName,
    });
}
async function getGroup(groupId, userId) {
    const group = await BuddyGroup_1.BuddyGroup.findById(groupId);
    if (!group)
        throw new Error("GROUP_NOT_FOUND");
    assertMember(group, userId);
    return group;
}
async function getMyGroup(userId) {
    return BuddyGroup_1.BuddyGroup.findOne({
        isActive: true,
        members: { $elemMatch: { userId, status: "joined" } },
    });
}
// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------
async function sendMessage(input, io) {
    const group = await BuddyGroup_1.BuddyGroup.findById(input.groupId);
    if (!group || !group.isActive)
        throw new Error("GROUP_NOT_FOUND");
    assertMember(group, input.senderUserId);
    const message = await BuddyMessage_1.BuddyMessage.create({
        groupId: input.groupId,
        senderUserId: input.senderUserId,
        senderDisplayName: input.senderDisplayName,
        type: input.type ?? "text",
        text: input.text,
        progressChapter: input.progressChapter ?? null,
        progressPage: input.progressPage ?? null,
    });
    io.to(input.groupId).emit("buddy:message", {
        groupId: input.groupId,
        message: {
            _id: String(message._id),
            senderUserId: message.senderUserId,
            senderDisplayName: message.senderDisplayName,
            type: message.type,
            text: message.text,
            progressChapter: message.progressChapter,
            progressPage: message.progressPage,
            createdAt: message.createdAt,
        },
    });
    return message;
}
async function getMessages(input) {
    const group = await BuddyGroup_1.BuddyGroup.findById(input.groupId);
    if (!group)
        throw new Error("GROUP_NOT_FOUND");
    assertMember(group, input.userId);
    const limit = Math.min(input.limit ?? 50, 100);
    const query = { groupId: input.groupId };
    if (input.before) {
        query["_id"] = { $lt: input.before };
    }
    return BuddyMessage_1.BuddyMessage.find(query).sort({ _id: -1 }).limit(limit);
}
//# sourceMappingURL=buddy-service.js.map
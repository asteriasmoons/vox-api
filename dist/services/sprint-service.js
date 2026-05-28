"use strict";
// src/services/sprint-service.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActiveSprint = getActiveSprint;
exports.startSprint = startSprint;
exports.joinSprint = joinSprint;
exports.submitEndPage = submitEndPage;
exports.sendSprintMessage = sendSprintMessage;
exports.getSprintMessages = getSprintMessages;
exports.getAllTimeLeaderboard = getAllTimeLeaderboard;
exports.getUserLeaderboardEntry = getUserLeaderboardEntry;
exports.restoreActiveSprintTimers = restoreActiveSprintTimers;
const Sprint_1 = require("../models/Sprint");
const SprintMessage_1 = require("../models/SprintMessage");
const SprintLeaderboard_1 = require("../models/SprintLeaderboard");
const SPRINT_ROOM = "sprint:global";
const WAITING_WINDOW_MS = 30 * 1000;
const WARNING_BEFORE_END_MS = 3 * 60 * 1000;
const SUBMIT_GRACE_MS = 60 * 1000;
const activeTimers = new Map();
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function clearSprintTimers(sprintId) {
    const timers = activeTimers.get(sprintId);
    if (timers) {
        timers.forEach((t) => clearTimeout(t));
        activeTimers.delete(sprintId);
    }
}
function addSprintTimer(sprintId, timer) {
    if (!activeTimers.has(sprintId))
        activeTimers.set(sprintId, []);
    activeTimers.get(sprintId).push(timer);
}
async function postSystemMessage(text, sprintId = null, resultPayload = null) {
    return SprintMessage_1.SprintMessage.create({
        senderUserId: "system",
        senderDisplayName: "system",
        type: resultPayload ? "sprint_result" : "system",
        text,
        sprintId,
        resultPayload,
    });
}
// ---------------------------------------------------------------------------
// Sprint lifecycle
// ---------------------------------------------------------------------------
async function getActiveSprint() {
    return Sprint_1.Sprint.findOne({
        status: { $in: ["waiting", "active", "submitting"] },
    });
}
async function startSprint(input, io) {
    const existing = await getActiveSprint();
    if (existing)
        throw new Error("SPRINT_ALREADY_ACTIVE");
    const now = new Date();
    const startsAt = new Date(now.getTime() + WAITING_WINDOW_MS);
    const endsAt = new Date(startsAt.getTime() + input.durationMinutes * 60 * 1000);
    const sprint = await Sprint_1.Sprint.create({
        startedByUserId: input.userId,
        startedByDisplayName: input.displayName,
        durationMinutes: input.durationMinutes,
        startsAt,
        endsAt,
        status: "waiting",
        participants: [
            {
                userId: input.userId,
                displayName: input.displayName,
                startPage: input.startPage,
                endPage: null,
                pagesRead: null,
                pointsAwarded: null,
                joinedAt: now,
                submittedAt: null,
            },
        ],
    });
    const sprintId = String(sprint._id);
    const systemMsg = await postSystemMessage(`${input.displayName} started a ${input.durationMinutes} minute reading sprint! Join now before it begins.`, sprintId);
    io.to(SPRINT_ROOM).emit("sprint:started", {
        sprint: sprint.toObject(),
        message: systemMsg.toObject(),
    });
    const startTimer = setTimeout(async () => {
        await transitionToActive(sprintId, io);
    }, WAITING_WINDOW_MS);
    addSprintTimer(sprintId, startTimer);
    const warningDelay = WAITING_WINDOW_MS + input.durationMinutes * 60 * 1000 - WARNING_BEFORE_END_MS;
    if (warningDelay > 0) {
        const warningTimer = setTimeout(async () => {
            await transitionToSubmitting(sprintId, io);
        }, warningDelay);
        addSprintTimer(sprintId, warningTimer);
    }
    const endTimer = setTimeout(async () => {
        await finishSprint(sprintId, io);
    }, WAITING_WINDOW_MS + input.durationMinutes * 60 * 1000 + SUBMIT_GRACE_MS);
    addSprintTimer(sprintId, endTimer);
    return sprint;
}
async function transitionToActive(sprintId, io) {
    const sprint = await Sprint_1.Sprint.findById(sprintId);
    if (!sprint || sprint.status !== "waiting")
        return;
    sprint.status = "active";
    await sprint.save();
    const msg = await postSystemMessage("Sprint has started! Start reading.", sprintId);
    io.to(SPRINT_ROOM).emit("sprint:active", { sprintId, message: msg.toObject() });
}
async function transitionToSubmitting(sprintId, io) {
    const sprint = await Sprint_1.Sprint.findById(sprintId);
    if (!sprint || sprint.status !== "active")
        return;
    sprint.status = "submitting";
    await sprint.save();
    const msg = await postSystemMessage("3 minutes left! Enter your end page now.", sprintId);
    io.to(SPRINT_ROOM).emit("sprint:warning", { sprintId, message: msg.toObject() });
}
async function finishSprint(sprintId, io) {
    const sprint = await Sprint_1.Sprint.findById(sprintId);
    if (!sprint || sprint.status === "finished")
        return;
    sprint.status = "finished";
    for (const p of sprint.participants) {
        if (p.endPage !== null && p.endPage > p.startPage) {
            p.pagesRead = p.endPage - p.startPage;
            p.pointsAwarded = p.pagesRead;
        }
        else {
            p.pagesRead = 0;
            p.pointsAwarded = 0;
        }
    }
    await sprint.save();
    for (const p of sprint.participants) {
        if (p.submittedAt !== null) {
            await SprintLeaderboard_1.SprintLeaderboard.findOneAndUpdate({ userId: p.userId }, {
                $inc: {
                    totalPoints: p.pointsAwarded ?? 0,
                    totalPagesRead: p.pagesRead ?? 0,
                    sprintsParticipated: 1,
                },
                $set: { displayName: p.displayName, lastSprintAt: new Date() },
            }, { upsert: true, new: true });
        }
    }
    const ranked = [...sprint.participants]
        .filter((p) => p.submittedAt !== null)
        .sort((a, b) => (b.pagesRead ?? 0) - (a.pagesRead ?? 0));
    const resultPayload = {
        sprintId,
        durationMinutes: sprint.durationMinutes,
        ranked: ranked.map((p, i) => ({
            rank: i + 1,
            userId: p.userId,
            displayName: p.displayName,
            pagesRead: p.pagesRead ?? 0,
            pointsAwarded: p.pointsAwarded ?? 0,
        })),
    };
    const msg = await postSystemMessage(`Sprint finished! ${ranked.length} reader${ranked.length === 1 ? "" : "s"} completed the sprint.`, sprintId, resultPayload);
    clearSprintTimers(sprintId);
    io.to(SPRINT_ROOM).emit("sprint:finished", {
        sprintId,
        resultPayload,
        message: msg.toObject(),
    });
}
// ---------------------------------------------------------------------------
// Join & submit
// ---------------------------------------------------------------------------
async function joinSprint(input, io) {
    const sprint = await Sprint_1.Sprint.findById(input.sprintId);
    if (!sprint)
        throw new Error("SPRINT_NOT_FOUND");
    if (sprint.status === "finished")
        throw new Error("SPRINT_FINISHED");
    const existing = sprint.participants.find((p) => p.userId === input.userId);
    if (existing)
        throw new Error("ALREADY_JOINED");
    sprint.participants.push({
        userId: input.userId,
        displayName: input.displayName,
        startPage: input.startPage,
        endPage: null,
        pagesRead: null,
        pointsAwarded: null,
        joinedAt: new Date(),
        submittedAt: null,
    });
    await sprint.save();
    const msg = await postSystemMessage(`${input.displayName} joined the sprint!`, input.sprintId);
    io.to(SPRINT_ROOM).emit("sprint:joined", {
        sprintId: input.sprintId,
        userId: input.userId,
        displayName: input.displayName,
        message: msg.toObject(),
    });
    return sprint;
}
async function submitEndPage(input, io) {
    const sprint = await Sprint_1.Sprint.findById(input.sprintId);
    if (!sprint)
        throw new Error("SPRINT_NOT_FOUND");
    if (sprint.status === "finished")
        throw new Error("SPRINT_FINISHED");
    if (sprint.status === "waiting" || sprint.status === "active")
        throw new Error("SPRINT_NOT_IN_SUBMISSION");
    const participant = sprint.participants.find((p) => p.userId === input.userId);
    if (!participant)
        throw new Error("NOT_A_PARTICIPANT");
    if (participant.submittedAt !== null)
        throw new Error("ALREADY_SUBMITTED");
    participant.endPage = input.endPage;
    participant.submittedAt = new Date();
    await sprint.save();
    io.to(SPRINT_ROOM).emit("sprint:page_submitted", {
        sprintId: input.sprintId,
        userId: input.userId,
        displayName: participant.displayName,
    });
    return sprint;
}
// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------
async function sendSprintMessage(input, io) {
    const message = await SprintMessage_1.SprintMessage.create({
        senderUserId: input.senderUserId,
        senderDisplayName: input.senderDisplayName,
        type: "text",
        text: input.text,
        sprintId: null,
        resultPayload: null,
    });
    io.to(SPRINT_ROOM).emit("sprint:message", { message: message.toObject() });
    return message;
}
async function getSprintMessages(input) {
    const limit = Math.min(input.limit ?? 50, 100);
    const query = {};
    if (input.before)
        query["_id"] = { $lt: input.before };
    return SprintMessage_1.SprintMessage.find(query).sort({ _id: -1 }).limit(limit);
}
// ---------------------------------------------------------------------------
// Leaderboard
// ---------------------------------------------------------------------------
async function getAllTimeLeaderboard() {
    return SprintLeaderboard_1.SprintLeaderboard.find().sort({ totalPoints: -1 }).limit(100);
}
async function getUserLeaderboardEntry(userId) {
    return SprintLeaderboard_1.SprintLeaderboard.findOne({ userId });
}
// ---------------------------------------------------------------------------
// Restore timers on server restart
// ---------------------------------------------------------------------------
async function restoreActiveSprintTimers(io) {
    const sprint = await getActiveSprint();
    if (!sprint)
        return;
    const sprintId = String(sprint._id);
    const now = Date.now();
    if (sprint.status === "waiting") {
        const startDelay = sprint.startsAt.getTime() - now;
        if (startDelay > 0) {
            addSprintTimer(sprintId, setTimeout(() => transitionToActive(sprintId, io), startDelay));
        }
        else {
            await transitionToActive(sprintId, io);
        }
    }
    if (sprint.status === "waiting" || sprint.status === "active") {
        const warningDelay = sprint.endsAt.getTime() - WARNING_BEFORE_END_MS - now;
        if (warningDelay > 0) {
            addSprintTimer(sprintId, setTimeout(() => transitionToSubmitting(sprintId, io), warningDelay));
        }
        else if (sprint.status === "active") {
            await transitionToSubmitting(sprintId, io);
        }
    }
    if (sprint.status !== "finished") {
        const endDelay = sprint.endsAt.getTime() + SUBMIT_GRACE_MS - now;
        if (endDelay > 0) {
            addSprintTimer(sprintId, setTimeout(() => finishSprint(sprintId, io), endDelay));
        }
        else {
            await finishSprint(sprintId, io);
        }
    }
}
//# sourceMappingURL=sprint-service.js.map
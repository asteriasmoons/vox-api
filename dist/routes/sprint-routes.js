"use strict";
// src/routes/sprint-routes.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSprintRouter = createSprintRouter;
const express_1 = require("express");
const sprint_service_1 = require("../services/sprint-service");
const SprintMessage_1 = require("../models/SprintMessage");
const ADMIN_USER_ID = "001664.f2fefbb84f024544b98e865fa6c6b49e.1524";
function createSprintRouter(io) {
    const router = (0, express_1.Router)();
    function str(val) {
        if (typeof val === "string")
            return val;
        if (Array.isArray(val) && typeof val[0] === "string")
            return val[0];
        return "";
    }
    function handleError(res, error) {
        const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
        const status = message === "SPRINT_NOT_FOUND" ? 404
            : message === "SPRINT_ALREADY_ACTIVE" ? 409
                : message === "ALREADY_JOINED" ? 409
                    : message === "ALREADY_SUBMITTED" ? 409
                        : message === "SPRINT_FINISHED" ? 410
                            : message === "SPRINT_NOT_IN_SUBMISSION" ? 400
                                : message === "NOT_A_PARTICIPANT" ? 403
                                    : message === "FORBIDDEN" ? 403
                                        : 400;
        return res.status(status).json({ success: false, error: message });
    }
    // ── Sprint state ──────────────────────────────────────────────────────────
    router.get("/active", async (_req, res) => {
        try {
            const sprint = await (0, sprint_service_1.getActiveSprint)();
            return res.json({ success: true, sprint });
        }
        catch (error) {
            return handleError(res, error);
        }
    });
    // ── Sprint actions ────────────────────────────────────────────────────────
    router.post("/start", async (req, res) => {
        try {
            const sprint = await (0, sprint_service_1.startSprint)({
                userId: req.body.userId,
                displayName: req.body.displayName,
                durationMinutes: Number(req.body.durationMinutes),
                startPage: Number(req.body.startPage),
            }, io);
            return res.status(201).json({ success: true, sprint });
        }
        catch (error) {
            return handleError(res, error);
        }
    });
    router.post("/:id/join", async (req, res) => {
        try {
            const sprint = await (0, sprint_service_1.joinSprint)({
                sprintId: str(req.params.id),
                userId: req.body.userId,
                displayName: req.body.displayName,
                startPage: Number(req.body.startPage),
            }, io);
            return res.status(200).json({ success: true, sprint });
        }
        catch (error) {
            return handleError(res, error);
        }
    });
    router.post("/:id/submit", async (req, res) => {
        try {
            const sprint = await (0, sprint_service_1.submitEndPage)({
                sprintId: str(req.params.id),
                userId: req.body.userId,
                endPage: Number(req.body.endPage),
            }, io);
            return res.json({ success: true, sprint });
        }
        catch (error) {
            return handleError(res, error);
        }
    });
    // ── Messages ──────────────────────────────────────────────────────────────
    router.post("/messages", async (req, res) => {
        try {
            const message = await (0, sprint_service_1.sendSprintMessage)({
                senderUserId: req.body.senderUserId,
                senderDisplayName: req.body.senderDisplayName,
                text: req.body.text,
            }, io);
            return res.status(201).json({ success: true, message });
        }
        catch (error) {
            return handleError(res, error);
        }
    });
    router.get("/messages", async (req, res) => {
        try {
            const before = str(req.query.before) || null;
            const limitRaw = str(req.query.limit);
            const limit = limitRaw ? parseInt(limitRaw, 10) : 50;
            const messages = await (0, sprint_service_1.getSprintMessages)({ before, limit });
            return res.json({ success: true, messages });
        }
        catch (error) {
            return handleError(res, error);
        }
    });
    // DELETE /api/sprint/messages — admin only, clears all sprint messages
    router.delete("/messages", async (req, res) => {
        try {
            const userId = str(req.query.userId);
            if (userId !== ADMIN_USER_ID) {
                return res.status(403).json({ success: false, error: "FORBIDDEN" });
            }
            await SprintMessage_1.SprintMessage.deleteMany({});
            io.to("sprint:global").emit("sprint:chat_cleared");
            return res.json({ success: true });
        }
        catch (error) {
            return handleError(res, error);
        }
    });
    // ── Leaderboard ───────────────────────────────────────────────────────────
    router.get("/leaderboard", async (_req, res) => {
        try {
            const leaderboard = await (0, sprint_service_1.getAllTimeLeaderboard)();
            return res.json({ success: true, leaderboard });
        }
        catch (error) {
            return handleError(res, error);
        }
    });
    router.get("/leaderboard/:userId", async (req, res) => {
        try {
            const entry = await (0, sprint_service_1.getUserLeaderboardEntry)(str(req.params.userId));
            return res.json({ success: true, entry });
        }
        catch (error) {
            return handleError(res, error);
        }
    });
    return router;
}
//# sourceMappingURL=sprint-routes.js.map
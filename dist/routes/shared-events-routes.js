"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const shared_events_service_1 = require("../services/shared-events-service");
const router = (0, express_1.Router)();
function handleError(res, error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    const status = message === "EVENT_NOT_FOUND"
        ? 404
        : message === "ATTENDEE_NOT_FOUND"
            ? 404
            : message === "NOT_A_MEMBER"
                ? 403
                : message === "FORBIDDEN"
                    ? 403
                    : message === "EVENT_NOT_JOINABLE"
                        ? 403
                        : message === "HOST_CANNOT_LEAVE"
                            ? 403
                            : message === "HOST_ALREADY_MEMBER"
                                ? 400
                                : message === "JOIN_CODE_GENERATION_FAILED"
                                    ? 500
                                    : 400;
    return res.status(status).json({
        success: false,
        error: message,
    });
}
router.post("/", async (req, res) => {
    try {
        const result = await (0, shared_events_service_1.createSharedEvent)(req.body);
        return res.status(201).json({
            success: true,
            ...result,
        });
    }
    catch (error) {
        return handleError(res, error);
    }
});
router.get("/join-code/:joinCode", async (req, res) => {
    try {
        const joinCode = typeof req.params.joinCode === "string" ? req.params.joinCode : "";
        const currentUserId = typeof req.query.currentUserId === "string"
            ? req.query.currentUserId
            : undefined;
        const result = await (0, shared_events_service_1.getSharedEventByJoinCode)(joinCode, currentUserId);
        return res.json({
            success: true,
            ...result,
        });
    }
    catch (error) {
        return handleError(res, error);
    }
});
router.post("/join-by-code", async (req, res) => {
    try {
        const result = await (0, shared_events_service_1.joinSharedEventByCode)(req.body);
        return res.json({
            success: true,
            ...result,
        });
    }
    catch (error) {
        return handleError(res, error);
    }
});
router.post("/:eventId/invite", async (req, res) => {
    try {
        const result = await (0, shared_events_service_1.inviteAttendee)({
            eventId: typeof req.params.eventId === "string" ? req.params.eventId : "",
            actorUserId: req.body.actorUserId,
            inviteeUserId: req.body.inviteeUserId,
            inviteeDisplayName: req.body.inviteeDisplayName,
        });
        return res.json({
            success: true,
            ...result,
        });
    }
    catch (error) {
        return handleError(res, error);
    }
});
router.post("/:eventId/accept", async (req, res) => {
    try {
        const result = await (0, shared_events_service_1.acceptInvite)({
            eventId: typeof req.params.eventId === "string" ? req.params.eventId : "",
            userId: req.body.userId,
            displayName: req.body.displayName,
        });
        return res.json({
            success: true,
            ...result,
        });
    }
    catch (error) {
        return handleError(res, error);
    }
});
router.post("/:eventId/leave", async (req, res) => {
    try {
        const result = await (0, shared_events_service_1.leaveSharedEvent)({
            eventId: typeof req.params.eventId === "string" ? req.params.eventId : "",
            userId: req.body.userId,
        });
        return res.json({
            success: true,
            ...result,
        });
    }
    catch (error) {
        return handleError(res, error);
    }
});
router.patch("/:eventId", async (req, res) => {
    try {
        const result = await (0, shared_events_service_1.updateSharedEvent)({
            eventId: typeof req.params.eventId === "string" ? req.params.eventId : "",
            actorUserId: req.body.actorUserId,
            title: req.body.title,
            startDate: req.body.startDate,
            endDate: req.body.endDate,
            allDay: req.body.allDay,
            eventDescription: req.body.eventDescription,
            color: req.body.color,
            meetingUrl: req.body.meetingUrl,
            location: req.body.location,
            recurrenceRRule: req.body.recurrenceRRule,
            timeZoneId: req.body.timeZoneId,
            calendarId: req.body.calendarId,
            serverId: req.body.serverId,
            isJoinable: req.body.isJoinable,
            shareMode: req.body.shareMode,
            requiresApprovalToJoin: req.body.requiresApprovalToJoin,
            allowGuestsToInvite: req.body.allowGuestsToInvite,
            allowGuestsToEdit: req.body.allowGuestsToEdit,
        });
        return res.json({
            success: true,
            ...result,
        });
    }
    catch (error) {
        return handleError(res, error);
    }
});
router.get("/:eventId/attendees", async (req, res) => {
    try {
        const eventId = typeof req.params.eventId === "string" ? req.params.eventId : "";
        const attendees = await (0, shared_events_service_1.listAttendees)(eventId);
        return res.json({
            success: true,
            attendees,
        });
    }
    catch (error) {
        return handleError(res, error);
    }
});
exports.default = router;
//# sourceMappingURL=shared-events-routes.js.map
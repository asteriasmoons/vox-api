"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSharedEvent = createSharedEvent;
exports.getSharedEventByJoinCode = getSharedEventByJoinCode;
exports.joinSharedEventByCode = joinSharedEventByCode;
exports.inviteAttendee = inviteAttendee;
exports.acceptInvite = acceptInvite;
exports.leaveSharedEvent = leaveSharedEvent;
exports.updateSharedEvent = updateSharedEvent;
exports.listAttendees = listAttendees;
const SharedEvent_1 = require("../models/SharedEvent");
const SharedEventAttendee_1 = require("../models/SharedEventAttendee");
const shared_event_utils_1 = require("../utils/shared-event-utils");
async function generateUniqueJoinCode() {
    for (let i = 0; i < 25; i += 1) {
        const joinCode = (0, shared_event_utils_1.generateJoinCode)();
        const existing = await SharedEvent_1.SharedEvent.findOne({ joinCode }).lean();
        if (!existing)
            return joinCode;
    }
    throw new Error("JOIN_CODE_GENERATION_FAILED");
}
async function getAttendeesForEvent(eventId) {
    return SharedEventAttendee_1.SharedEventAttendee.find({ eventId }).sort({
        isHost: -1,
        joinedAt: -1,
        invitedAt: 1,
    });
}
async function recalculateAttendeeCount(eventId) {
    const attendees = await SharedEventAttendee_1.SharedEventAttendee.find({ eventId }).lean();
    return attendees.filter((a) => a.isHost || a.status === "owner" || a.status === "joined").length;
}
async function syncAttendeeCount(event) {
    event.attendeeCount = await recalculateAttendeeCount(String(event._id));
    await event.save();
    return event;
}
async function createSharedEvent(input) {
    const joinCode = await generateUniqueJoinCode();
    const event = await SharedEvent_1.SharedEvent.create({
        localEventId: input.localEventId,
        ownerUserId: input.ownerUserId,
        ownerDisplayName: input.ownerDisplayName,
        title: input.title,
        startDate: input.startDate,
        endDate: input.endDate ?? null,
        allDay: input.allDay,
        eventDescription: input.eventDescription ?? null,
        color: input.color ?? null,
        meetingUrl: input.meetingUrl ?? null,
        location: input.location ?? null,
        recurrenceRRule: input.recurrenceRRule ?? null,
        timeZoneId: input.timeZoneId ?? null,
        calendarId: input.calendarId ?? null,
        serverId: input.serverId ?? null,
        isSharedEvent: true,
        isJoinable: input.isJoinable ?? true,
        shareMode: input.shareMode ?? "shared",
        requiresApprovalToJoin: input.requiresApprovalToJoin ?? false,
        allowGuestsToInvite: input.allowGuestsToInvite ?? false,
        allowGuestsToEdit: input.allowGuestsToEdit ?? false,
        joinCode,
        attendeeCount: 1,
    });
    const hostAttendee = await SharedEventAttendee_1.SharedEventAttendee.create({
        eventId: event._id,
        eventLocalId: event.localEventId,
        userId: input.ownerUserId,
        displayName: input.ownerDisplayName,
        status: "owner",
        isHost: true,
        invitedAt: new Date(),
        joinedAt: new Date(),
    });
    return {
        event,
        attendees: [hostAttendee],
        currentUserAttendee: hostAttendee,
    };
}
async function getSharedEventByJoinCode(joinCode, currentUserId) {
    const code = joinCode.trim().toUpperCase();
    const event = await SharedEvent_1.SharedEvent.findOne({ joinCode: code });
    if (!event) {
        throw new Error("EVENT_NOT_FOUND");
    }
    const attendees = await getAttendeesForEvent(String(event._id));
    let currentUserAttendee = null;
    if (currentUserId) {
        currentUserAttendee = await SharedEventAttendee_1.SharedEventAttendee.findOne({
            eventId: event._id,
            userId: currentUserId,
        });
    }
    return {
        event,
        attendees,
        currentUserAttendee,
    };
}
async function joinSharedEventByCode(input) {
    const code = input.joinCode.trim().toUpperCase();
    const event = await SharedEvent_1.SharedEvent.findOne({ joinCode: code });
    if (!event) {
        throw new Error("EVENT_NOT_FOUND");
    }
    if (!event.isSharedEvent || !event.isJoinable) {
        throw new Error("EVENT_NOT_JOINABLE");
    }
    let attendee = await SharedEventAttendee_1.SharedEventAttendee.findOne({
        eventId: event._id,
        userId: input.userId,
    });
    if (attendee) {
        if (attendee.isHost) {
            const attendees = await getAttendeesForEvent(String(event._id));
            return {
                event,
                attendees,
                currentUserAttendee: attendee,
            };
        }
        attendee.displayName = input.displayName;
        attendee.status = event.requiresApprovalToJoin ? "invited" : "joined";
        attendee.joinedAt = event.requiresApprovalToJoin ? null : new Date();
        await attendee.save();
    }
    else {
        attendee = await SharedEventAttendee_1.SharedEventAttendee.create({
            eventId: event._id,
            eventLocalId: event.localEventId,
            userId: input.userId,
            displayName: input.displayName,
            status: event.requiresApprovalToJoin ? "invited" : "joined",
            isHost: false,
            invitedAt: new Date(),
            joinedAt: event.requiresApprovalToJoin ? null : new Date(),
        });
    }
    await syncAttendeeCount(event);
    const attendees = await getAttendeesForEvent(String(event._id));
    return {
        event,
        attendees,
        currentUserAttendee: attendee,
    };
}
async function inviteAttendee(input) {
    const event = await SharedEvent_1.SharedEvent.findById(input.eventId);
    if (!event) {
        throw new Error("EVENT_NOT_FOUND");
    }
    const actor = await SharedEventAttendee_1.SharedEventAttendee.findOne({
        eventId: event._id,
        userId: input.actorUserId,
    });
    if (!actor) {
        throw new Error("NOT_A_MEMBER");
    }
    const canInvite = actor.isHost ||
        actor.status === "owner" ||
        (event.allowGuestsToInvite && actor.status === "joined");
    if (!canInvite) {
        throw new Error("FORBIDDEN");
    }
    let attendee = await SharedEventAttendee_1.SharedEventAttendee.findOne({
        eventId: event._id,
        userId: input.inviteeUserId,
    });
    if (attendee) {
        attendee.displayName = input.inviteeDisplayName;
        attendee.status = "invited";
        attendee.joinedAt = null;
        attendee.invitedAt = new Date();
        await attendee.save();
    }
    else {
        attendee = await SharedEventAttendee_1.SharedEventAttendee.create({
            eventId: event._id,
            eventLocalId: event.localEventId,
            userId: input.inviteeUserId,
            displayName: input.inviteeDisplayName,
            status: "invited",
            isHost: false,
            invitedAt: new Date(),
            joinedAt: null,
        });
    }
    await syncAttendeeCount(event);
    const attendees = await getAttendeesForEvent(String(event._id));
    return {
        event,
        attendees,
        currentUserAttendee: actor,
    };
}
async function acceptInvite(input) {
    const event = await SharedEvent_1.SharedEvent.findById(input.eventId);
    if (!event) {
        throw new Error("EVENT_NOT_FOUND");
    }
    const attendee = await SharedEventAttendee_1.SharedEventAttendee.findOne({
        eventId: event._id,
        userId: input.userId,
    });
    if (!attendee) {
        throw new Error("ATTENDEE_NOT_FOUND");
    }
    if (attendee.isHost) {
        throw new Error("HOST_ALREADY_MEMBER");
    }
    attendee.displayName = input.displayName;
    attendee.status = "joined";
    attendee.joinedAt = new Date();
    await attendee.save();
    await syncAttendeeCount(event);
    const attendees = await getAttendeesForEvent(String(event._id));
    return {
        event,
        attendees,
        currentUserAttendee: attendee,
    };
}
async function leaveSharedEvent(input) {
    const event = await SharedEvent_1.SharedEvent.findById(input.eventId);
    if (!event) {
        throw new Error("EVENT_NOT_FOUND");
    }
    const attendee = await SharedEventAttendee_1.SharedEventAttendee.findOne({
        eventId: event._id,
        userId: input.userId,
    });
    if (!attendee) {
        throw new Error("ATTENDEE_NOT_FOUND");
    }
    if (attendee.isHost) {
        throw new Error("HOST_CANNOT_LEAVE");
    }
    attendee.status = "left";
    attendee.joinedAt = null;
    await attendee.save();
    await syncAttendeeCount(event);
    const attendees = await getAttendeesForEvent(String(event._id));
    return {
        event,
        attendees,
        currentUserAttendee: attendee,
    };
}
async function updateSharedEvent(input) {
    const event = await SharedEvent_1.SharedEvent.findById(input.eventId);
    if (!event) {
        throw new Error("EVENT_NOT_FOUND");
    }
    const actor = await SharedEventAttendee_1.SharedEventAttendee.findOne({
        eventId: event._id,
        userId: input.actorUserId,
    });
    if (!actor) {
        throw new Error("NOT_A_MEMBER");
    }
    const canEdit = actor.isHost ||
        actor.status === "owner" ||
        (event.allowGuestsToEdit && actor.status === "joined");
    if (!canEdit) {
        throw new Error("FORBIDDEN");
    }
    if (typeof input.title !== "undefined")
        event.title = input.title;
    if (typeof input.startDate !== "undefined")
        event.startDate = input.startDate;
    if (typeof input.endDate !== "undefined")
        event.endDate = input.endDate;
    if (typeof input.allDay !== "undefined")
        event.allDay = input.allDay;
    if (typeof input.eventDescription !== "undefined")
        event.eventDescription = input.eventDescription;
    if (typeof input.color !== "undefined")
        event.color = input.color;
    if (typeof input.meetingUrl !== "undefined")
        event.meetingUrl = input.meetingUrl;
    if (typeof input.location !== "undefined")
        event.location = input.location;
    if (typeof input.recurrenceRRule !== "undefined")
        event.recurrenceRRule = input.recurrenceRRule;
    if (typeof input.timeZoneId !== "undefined")
        event.timeZoneId = input.timeZoneId;
    if (typeof input.calendarId !== "undefined")
        event.calendarId = input.calendarId;
    if (typeof input.serverId !== "undefined")
        event.serverId = input.serverId;
    if (typeof input.isJoinable !== "undefined")
        event.isJoinable = input.isJoinable;
    if (typeof input.shareMode !== "undefined")
        event.shareMode = input.shareMode;
    if (typeof input.requiresApprovalToJoin !== "undefined") {
        event.requiresApprovalToJoin = input.requiresApprovalToJoin;
    }
    if (typeof input.allowGuestsToInvite !== "undefined") {
        event.allowGuestsToInvite = input.allowGuestsToInvite;
    }
    if (typeof input.allowGuestsToEdit !== "undefined") {
        event.allowGuestsToEdit = input.allowGuestsToEdit;
    }
    await event.save();
    const attendees = await getAttendeesForEvent(String(event._id));
    return {
        event,
        attendees,
        currentUserAttendee: actor,
    };
}
async function listAttendees(eventId) {
    const event = await SharedEvent_1.SharedEvent.findById(eventId);
    if (!event) {
        throw new Error("EVENT_NOT_FOUND");
    }
    return getAttendeesForEvent(String(event._id));
}
//# sourceMappingURL=shared-events-service.js.map
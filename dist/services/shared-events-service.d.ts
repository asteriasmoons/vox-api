import { ISharedEvent } from "../models/SharedEvent";
import { ISharedEventAttendee } from "../models/SharedEventAttendee";
type CreateSharedEventInput = {
    ownerUserId: string;
    ownerDisplayName: string;
    localEventId: string;
    title: string;
    startDate: string;
    endDate?: string | null;
    allDay: boolean;
    eventDescription?: string | null;
    color?: string | null;
    meetingUrl?: string | null;
    location?: string | null;
    recurrenceRRule?: string | null;
    timeZoneId?: string | null;
    calendarId?: string | null;
    serverId?: string | null;
    isJoinable?: boolean;
    shareMode?: "personal" | "invite_only" | "shared";
    requiresApprovalToJoin?: boolean;
    allowGuestsToInvite?: boolean;
    allowGuestsToEdit?: boolean;
};
type JoinSharedEventByCodeInput = {
    joinCode: string;
    userId: string;
    displayName: string;
};
type InviteAttendeeInput = {
    eventId: string;
    actorUserId: string;
    inviteeUserId: string;
    inviteeDisplayName: string;
};
type AcceptInviteInput = {
    eventId: string;
    userId: string;
    displayName: string;
};
type LeaveSharedEventInput = {
    eventId: string;
    userId: string;
};
type UpdateSharedEventInput = {
    eventId: string;
    actorUserId: string;
    title?: string;
    startDate?: string;
    endDate?: string | null;
    allDay?: boolean;
    eventDescription?: string | null;
    color?: string | null;
    meetingUrl?: string | null;
    location?: string | null;
    recurrenceRRule?: string | null;
    timeZoneId?: string | null;
    calendarId?: string | null;
    serverId?: string | null;
    isJoinable?: boolean;
    shareMode?: "personal" | "invite_only" | "shared";
    requiresApprovalToJoin?: boolean;
    allowGuestsToInvite?: boolean;
    allowGuestsToEdit?: boolean;
};
type SharedEventResponse = {
    event: ISharedEvent;
    attendees: ISharedEventAttendee[];
    currentUserAttendee: ISharedEventAttendee | null;
};
export declare function createSharedEvent(input: CreateSharedEventInput): Promise<SharedEventResponse>;
export declare function getSharedEventByJoinCode(joinCode: string, currentUserId?: string): Promise<SharedEventResponse>;
export declare function joinSharedEventByCode(input: JoinSharedEventByCodeInput): Promise<SharedEventResponse>;
export declare function inviteAttendee(input: InviteAttendeeInput): Promise<SharedEventResponse>;
export declare function acceptInvite(input: AcceptInviteInput): Promise<SharedEventResponse>;
export declare function leaveSharedEvent(input: LeaveSharedEventInput): Promise<SharedEventResponse>;
export declare function updateSharedEvent(input: UpdateSharedEventInput): Promise<SharedEventResponse>;
export declare function listAttendees(eventId: string): Promise<(import("mongoose").Document<unknown, {}, ISharedEventAttendee, {}, {}> & ISharedEventAttendee & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
})[]>;
export {};
//# sourceMappingURL=shared-events-service.d.ts.map
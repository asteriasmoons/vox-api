export type SharedEventShareMode = "personal" | "invite_only" | "shared";
export type SharedEventParticipationStatus = "owner" | "invited" | "joined" | "declined" | "left";
export interface SharedEventRecord {
    id: string;
    localEventId: string;
    ownerUserId: string;
    ownerDisplayName: string;
    title: string;
    startDate: string;
    endDate: string | null;
    allDay: boolean;
    eventDescription: string | null;
    color: string | null;
    meetingUrl: string | null;
    location: string | null;
    recurrenceRRule: string | null;
    timeZoneId: string | null;
    calendarId: string | null;
    serverId: string | null;
    isSharedEvent: boolean;
    isJoinable: boolean;
    shareMode: SharedEventShareMode;
    requiresApprovalToJoin: boolean;
    allowGuestsToInvite: boolean;
    allowGuestsToEdit: boolean;
    joinCode: string;
    attendeeCount: number;
    createdAt: string;
    updatedAt: string;
}
export interface SharedEventAttendeeRecord {
    id: string;
    eventId: string;
    eventLocalId: string;
    userId: string;
    displayName: string;
    status: SharedEventParticipationStatus;
    isHost: boolean;
    invitedAt: string;
    joinedAt: string | null;
    createdAt: string;
    updatedAt: string;
}
export interface CreateSharedEventInput {
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
    shareMode?: SharedEventShareMode;
    requiresApprovalToJoin?: boolean;
    allowGuestsToInvite?: boolean;
    allowGuestsToEdit?: boolean;
}
export interface JoinSharedEventByCodeInput {
    joinCode: string;
    userId: string;
    displayName: string;
}
export interface InviteAttendeeInput {
    eventId: string;
    actorUserId: string;
    inviteeUserId: string;
    inviteeDisplayName: string;
}
export interface LeaveSharedEventInput {
    eventId: string;
    userId: string;
}
export interface SharedEventResponse {
    event: SharedEventRecord;
    attendees: SharedEventAttendeeRecord[];
    currentUserAttendee: SharedEventAttendeeRecord | null;
}
//# sourceMappingURL=shared-events.d.ts.map
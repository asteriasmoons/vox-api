import { Document, Model } from "mongoose";
export type SharedEventShareMode = "personal" | "invite_only" | "shared";
export interface ISharedEvent extends Document {
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
    createdAt: Date;
    updatedAt: Date;
}
export declare const SharedEvent: Model<ISharedEvent>;
//# sourceMappingURL=SharedEvent.d.ts.map
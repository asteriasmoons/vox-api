import mongoose, { Document, Model } from "mongoose";
export type SharedEventParticipationStatus = "owner" | "invited" | "joined" | "declined" | "left";
export interface ISharedEventAttendee extends Document {
    eventId: mongoose.Types.ObjectId;
    eventLocalId: string;
    userId: string;
    displayName: string;
    status: SharedEventParticipationStatus;
    isHost: boolean;
    invitedAt: Date;
    joinedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
export declare const SharedEventAttendee: Model<ISharedEventAttendee>;
//# sourceMappingURL=SharedEventAttendee.d.ts.map
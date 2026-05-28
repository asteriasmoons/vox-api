import { Document, Model } from "mongoose";
export type SprintStatus = "waiting" | "active" | "submitting" | "finished";
export interface ISprintParticipant {
    userId: string;
    displayName: string;
    startPage: number;
    endPage: number | null;
    pagesRead: number | null;
    pointsAwarded: number | null;
    joinedAt: Date;
    submittedAt: Date | null;
}
export interface ISprint extends Document {
    startedByUserId: string;
    startedByDisplayName: string;
    durationMinutes: number;
    startsAt: Date;
    endsAt: Date;
    status: SprintStatus;
    participants: ISprintParticipant[];
    createdAt: Date;
    updatedAt: Date;
}
export declare const Sprint: Model<ISprint>;
//# sourceMappingURL=Sprint.d.ts.map
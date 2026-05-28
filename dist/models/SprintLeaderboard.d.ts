import { Document, Model } from "mongoose";
export interface ISprintLeaderboard extends Document {
    userId: string;
    displayName: string;
    totalPoints: number;
    totalPagesRead: number;
    sprintsParticipated: number;
    lastSprintAt: Date | null;
    updatedAt: Date;
    createdAt: Date;
}
export declare const SprintLeaderboard: Model<ISprintLeaderboard>;
//# sourceMappingURL=SprintLeaderboard.d.ts.map
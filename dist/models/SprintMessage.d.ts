import { Document, Model } from "mongoose";
export type SprintMessageType = "text" | "system" | "sprint_result";
export interface ISprintMessage extends Document {
    senderUserId: string;
    senderDisplayName: string;
    type: SprintMessageType;
    text: string;
    sprintId: string | null;
    resultPayload: unknown | null;
    createdAt: Date;
    updatedAt: Date;
}
export declare const SprintMessage: Model<ISprintMessage>;
//# sourceMappingURL=SprintMessage.d.ts.map
import { Document, Model } from "mongoose";
export type BuddyMessageType = "text" | "progress_update" | "system";
export interface IBuddyMessage extends Document {
    groupId: string;
    senderUserId: string;
    senderDisplayName: string;
    type: BuddyMessageType;
    text: string;
    progressChapter: number | null;
    progressPage: number | null;
    createdAt: Date;
    updatedAt: Date;
}
export declare const BuddyMessage: Model<IBuddyMessage>;
//# sourceMappingURL=BuddyMessage.d.ts.map
import { Document } from "mongoose";
export interface DailyPromptUsageDoc extends Document {
    userId: string;
    dateKey: string;
    count: number;
    updatedAt: Date;
}
export declare const DailyPromptUsage: import("mongoose").Model<DailyPromptUsageDoc, {}, {}, {}, Document<unknown, {}, DailyPromptUsageDoc, {}, {}> & DailyPromptUsageDoc & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=DailyPromptUsage.d.ts.map
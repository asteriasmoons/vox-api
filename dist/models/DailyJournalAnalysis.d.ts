import { Document } from "mongoose";
export interface DailyJournalAnalysisDoc extends Document {
    userId: string;
    bookId: string;
    dateKey: string;
    themes: string[];
    mood: string;
    reflection: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const DailyJournalAnalysis: import("mongoose").Model<DailyJournalAnalysisDoc, {}, {}, {}, Document<unknown, {}, DailyJournalAnalysisDoc, {}, {}> & DailyJournalAnalysisDoc & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=DailyJournalAnalysis.d.ts.map
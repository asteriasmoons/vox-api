"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DailyJournalAnalysis = void 0;
const mongoose_1 = require("mongoose");
const DailyJournalAnalysisSchema = new mongoose_1.Schema({
    userId: { type: String, required: true, index: true },
    bookId: { type: String, required: true, index: true },
    dateKey: { type: String, required: true, index: true },
    themes: { type: [String], required: true, default: [] },
    mood: { type: String, required: true, default: "" },
    reflection: { type: String, required: true, default: "" },
}, { timestamps: true });
DailyJournalAnalysisSchema.index({ userId: 1, bookId: 1, dateKey: 1 }, { unique: true });
exports.DailyJournalAnalysis = (0, mongoose_1.model)("DailyJournalAnalysis", DailyJournalAnalysisSchema);
//# sourceMappingURL=DailyJournalAnalysis.js.map
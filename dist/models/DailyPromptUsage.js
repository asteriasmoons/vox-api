"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DailyPromptUsage = void 0;
const mongoose_1 = require("mongoose");
const DailyPromptUsageSchema = new mongoose_1.Schema({
    userId: { type: String, required: true, index: true },
    dateKey: { type: String, required: true, index: true },
    count: { type: Number, required: true, default: 0 },
}, { timestamps: { createdAt: false, updatedAt: true } });
DailyPromptUsageSchema.index({ userId: 1, dateKey: 1 }, { unique: true });
exports.DailyPromptUsage = (0, mongoose_1.model)("DailyPromptUsage", DailyPromptUsageSchema);
//# sourceMappingURL=DailyPromptUsage.js.map
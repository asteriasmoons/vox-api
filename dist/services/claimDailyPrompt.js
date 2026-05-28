"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.claimDailyPrompt = claimDailyPrompt;
const DailyPromptUsage_1 = require("../models/DailyPromptUsage");
const chicagoDateKey_1 = require("../utils/chicagoDateKey");
const DAILY_LIMIT = 3;
async function claimDailyPrompt(userId) {
    const dateKey = (0, chicagoDateKey_1.chicagoDateKey)(new Date());
    const incRes = await DailyPromptUsage_1.DailyPromptUsage.updateOne({ userId, dateKey, count: { $lt: DAILY_LIMIT } }, { $inc: { count: 1 } });
    if (incRes.modifiedCount === 1) {
        const doc = await DailyPromptUsage_1.DailyPromptUsage.findOne({ userId, dateKey }).lean();
        const count = doc?.count ?? 1;
        return {
            allowed: true,
            remaining: Math.max(0, DAILY_LIMIT - count),
            dateKey,
        };
    }
    try {
        await DailyPromptUsage_1.DailyPromptUsage.create({
            userId,
            dateKey,
            count: 1,
        });
        return {
            allowed: true,
            remaining: DAILY_LIMIT - 1,
            dateKey,
        };
    }
    catch (err) {
        if (err?.code === 11000) {
            const doc = await DailyPromptUsage_1.DailyPromptUsage.findOne({ userId, dateKey }).lean();
            const count = doc?.count ?? DAILY_LIMIT;
            return {
                allowed: false,
                remaining: Math.max(0, DAILY_LIMIT - count),
                dateKey,
            };
        }
        throw err;
    }
}
//# sourceMappingURL=claimDailyPrompt.js.map
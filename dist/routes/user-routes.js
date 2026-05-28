"use strict";
// src/routes/user-routes.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const UserProfile_1 = require("../models/UserProfile");
const router = (0, express_1.Router)();
function str(val) {
    if (typeof val === "string")
        return val;
    if (Array.isArray(val) && typeof val[0] === "string")
        return val[0];
    return "";
}
// POST /api/user/display-name
// Body: { userId, displayName }
router.post("/display-name", async (req, res) => {
    try {
        const userId = str(req.body.userId).trim();
        const displayName = str(req.body.displayName).trim();
        if (!userId)
            return res.status(400).json({ success: false, error: "MISSING_USER_ID" });
        if (!displayName)
            return res.status(400).json({ success: false, error: "MISSING_DISPLAY_NAME" });
        if (displayName.length > 30)
            return res.status(400).json({ success: false, error: "DISPLAY_NAME_TOO_LONG" });
        const profile = await UserProfile_1.UserProfile.findOneAndUpdate({ userId }, { displayName }, { upsert: true, new: true });
        return res.json({ success: true, profile });
    }
    catch (error) {
        return res.status(500).json({ success: false, error: "SERVER_ERROR" });
    }
});
// GET /api/user/display-name/:userId
router.get("/display-name/:userId", async (req, res) => {
    try {
        const userId = str(req.params.userId);
        if (!userId)
            return res.status(400).json({ success: false, error: "MISSING_USER_ID" });
        const profile = await UserProfile_1.UserProfile.findOne({ userId });
        return res.json({ success: true, displayName: profile?.displayName ?? null });
    }
    catch (error) {
        return res.status(500).json({ success: false, error: "SERVER_ERROR" });
    }
});
exports.default = router;
//# sourceMappingURL=user-routes.js.map
"use strict";
// src/models/SharedEvent.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SharedEvent = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const SharedEventSchema = new mongoose_1.Schema({
    localEventId: { type: String, required: true, index: true },
    ownerUserId: { type: String, required: true, index: true },
    ownerDisplayName: { type: String, required: true },
    title: { type: String, required: true },
    startDate: { type: String, required: true },
    endDate: { type: String, default: null },
    allDay: { type: Boolean, required: true },
    eventDescription: { type: String, default: null },
    color: { type: String, default: null },
    meetingUrl: { type: String, default: null },
    location: { type: String, default: null },
    recurrenceRRule: { type: String, default: null },
    timeZoneId: { type: String, default: null },
    calendarId: { type: String, default: null },
    serverId: { type: String, default: null },
    isSharedEvent: { type: Boolean, default: true },
    isJoinable: { type: Boolean, default: true },
    shareMode: {
        type: String,
        enum: ["personal", "invite_only", "shared"],
        default: "shared",
    },
    requiresApprovalToJoin: { type: Boolean, default: false },
    allowGuestsToInvite: { type: Boolean, default: false },
    allowGuestsToEdit: { type: Boolean, default: false },
    joinCode: { type: String, required: true, unique: true, index: true },
    attendeeCount: { type: Number, default: 1 },
}, {
    timestamps: true,
});
exports.SharedEvent = mongoose_1.default.models.SharedEvent ||
    mongoose_1.default.model("SharedEvent", SharedEventSchema);
//# sourceMappingURL=SharedEvent.js.map
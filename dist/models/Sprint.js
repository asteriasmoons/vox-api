"use strict";
// src/models/Sprint.ts
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
exports.Sprint = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const SprintParticipantSchema = new mongoose_1.Schema({
    userId: { type: String, required: true },
    displayName: { type: String, required: true },
    startPage: { type: Number, required: true },
    endPage: { type: Number, default: null },
    pagesRead: { type: Number, default: null },
    pointsAwarded: { type: Number, default: null },
    joinedAt: { type: Date, required: true },
    submittedAt: { type: Date, default: null },
}, { _id: false });
const SprintSchema = new mongoose_1.Schema({
    startedByUserId: { type: String, required: true },
    startedByDisplayName: { type: String, required: true },
    durationMinutes: { type: Number, required: true, min: 5, max: 60 },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    status: {
        type: String,
        enum: ["waiting", "active", "submitting", "finished"],
        default: "waiting",
        index: true,
    },
    participants: { type: [SprintParticipantSchema], default: [] },
}, { timestamps: true });
exports.Sprint = mongoose_1.default.models.Sprint ||
    mongoose_1.default.model("Sprint", SprintSchema);
//# sourceMappingURL=Sprint.js.map
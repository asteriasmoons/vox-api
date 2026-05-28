"use strict";
// src/models/SharedEventAttendee.ts
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
exports.SharedEventAttendee = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const SharedEventAttendeeSchema = new mongoose_1.Schema({
    eventId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "SharedEvent",
        required: true,
        index: true,
    },
    eventLocalId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    displayName: { type: String, required: true },
    status: {
        type: String,
        enum: ["owner", "invited", "joined", "declined", "left"],
        required: true,
        default: "invited",
    },
    isHost: { type: Boolean, default: false },
    invitedAt: { type: Date, required: true, default: Date.now },
    joinedAt: { type: Date, default: null },
}, {
    timestamps: true,
});
SharedEventAttendeeSchema.index({ eventId: 1, userId: 1 }, { unique: true });
exports.SharedEventAttendee = mongoose_1.default.models.SharedEventAttendee ||
    mongoose_1.default.model("SharedEventAttendee", SharedEventAttendeeSchema);
//# sourceMappingURL=SharedEventAttendee.js.map
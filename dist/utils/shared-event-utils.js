"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateJoinCode = generateJoinCode;
const crypto_1 = __importDefault(require("crypto"));
const JOIN_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function generateJoinCode(length = 8) {
    let result = "";
    for (let i = 0; i < length; i += 1) {
        const index = crypto_1.default.randomInt(0, JOIN_CODE_CHARS.length);
        result += JOIN_CODE_CHARS[index];
    }
    return result;
}
//# sourceMappingURL=shared-event-utils.js.map
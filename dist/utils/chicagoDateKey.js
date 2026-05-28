"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chicagoDateKey = chicagoDateKey;
function chicagoDateKey(date) {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Chicago",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(date);
}
//# sourceMappingURL=chicagoDateKey.js.map
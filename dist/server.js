"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const summary_1 = __importDefault(require("./routes/summary"));
const recs_1 = __importDefault(require("./routes/recs"));
const journal_1 = __importDefault(require("./routes/journal"));
const astrology_1 = __importDefault(require("./routes/astrology"));
const shared_events_routes_1 = __importDefault(require("./routes/shared-events-routes"));
const buddy_routes_1 = require("./routes/buddy-routes");
const sprint_routes_1 = require("./routes/sprint-routes");
const user_routes_1 = __importDefault(require("./routes/user-routes"));
const sprint_service_1 = require("./services/sprint-service");
const wellness_wall_1 = __importDefault(require("./routes/wellness-wall"));
const spiritual_1 = __importDefault(require("./routes/spiritual"));
const mood_1 = __importDefault(require("./routes/mood"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const PORT = process.env.PORT || 3000;
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get("/", (_req, res) => {
    res.json({ status: "Lystaria Books API running" });
});
app.use("/api/books/summary", summary_1.default);
app.use("/api/books/recs", recs_1.default);
app.use("/api/journal", journal_1.default);
app.use("/api/astrology", astrology_1.default);
app.use("/api/shared-events", shared_events_routes_1.default);
app.use("/api/buddy", (0, buddy_routes_1.createBuddyRouter)(io));
app.use("/api/sprint", (0, sprint_routes_1.createSprintRouter)(io));
app.use("/api/user", user_routes_1.default);
app.use("/api", wellness_wall_1.default);
app.use("/api/spiritual", spiritual_1.default);
app.use("/api/mood", mood_1.default);
io.on("connection", (socket) => {
    socket.on("buddy:join_room", (groupId) => {
        socket.join(groupId);
    });
    socket.on("buddy:leave_room", (groupId) => {
        socket.leave(groupId);
    });
    socket.on("sprint:join_room", () => {
        socket.join("sprint:global");
    });
    socket.on("sprint:leave_room", () => {
        socket.leave("sprint:global");
    });
    socket.on("disconnect", () => { });
});
mongoose_1.default
    .connect(process.env.MONGODB_URI)
    .then(async () => {
    console.log("MongoDB Atlas connected");
    await (0, sprint_service_1.restoreActiveSprintTimers)(io);
    httpServer.listen(PORT, () => {
        console.log(`📚 Lystaria Books API running on port ${PORT}`);
    });
})
    .catch((err) => {
    console.error("MongoDB connection error:", err);
});
//# sourceMappingURL=server.js.map
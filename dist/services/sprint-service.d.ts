import { ISprint } from "../models/Sprint";
import { ISprintMessage } from "../models/SprintMessage";
import { ISprintLeaderboard } from "../models/SprintLeaderboard";
import { Server as SocketIOServer } from "socket.io";
type StartSprintInput = {
    userId: string;
    displayName: string;
    durationMinutes: number;
    startPage: number;
};
type JoinSprintInput = {
    sprintId: string;
    userId: string;
    displayName: string;
    startPage: number;
};
type SubmitEndPageInput = {
    sprintId: string;
    userId: string;
    endPage: number;
};
type SendSprintMessageInput = {
    senderUserId: string;
    senderDisplayName: string;
    text: string;
};
type GetMessagesInput = {
    before?: string | null;
    limit?: number;
};
export declare function getActiveSprint(): Promise<ISprint | null>;
export declare function startSprint(input: StartSprintInput, io: SocketIOServer): Promise<ISprint>;
export declare function joinSprint(input: JoinSprintInput, io: SocketIOServer): Promise<ISprint>;
export declare function submitEndPage(input: SubmitEndPageInput, io: SocketIOServer): Promise<ISprint>;
export declare function sendSprintMessage(input: SendSprintMessageInput, io: SocketIOServer): Promise<ISprintMessage>;
export declare function getSprintMessages(input: GetMessagesInput): Promise<ISprintMessage[]>;
export declare function getAllTimeLeaderboard(): Promise<ISprintLeaderboard[]>;
export declare function getUserLeaderboardEntry(userId: string): Promise<ISprintLeaderboard | null>;
export declare function restoreActiveSprintTimers(io: SocketIOServer): Promise<void>;
export {};
//# sourceMappingURL=sprint-service.d.ts.map
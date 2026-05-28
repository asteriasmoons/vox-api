import { IBuddyAnnouncement } from "../models/BuddyAnnouncement";
import { IBuddyGroup } from "../models/BuddyGroup";
import { IBuddyMessage } from "../models/BuddyMessage";
import { Server as SocketIOServer } from "socket.io";
type PostAnnouncementInput = {
    ownerUserId: string;
    ownerDisplayName: string;
    bookTitle: string;
    bookAuthor?: string | null;
    bookCoverUrl?: string | null;
    bookKey?: string | null;
    message?: string | null;
    currentChapter?: number | null;
    currentPage?: number | null;
    maxMembers?: number;
};
type RequestToJoinInput = {
    announcementId: string;
    requesterUserId: string;
    requesterDisplayName: string;
};
type RespondToJoinRequestInput = {
    groupId: string;
    actorUserId: string;
    targetUserId: string;
    accept: boolean;
};
type LeaveGroupInput = {
    groupId: string;
    userId: string;
};
type SendMessageInput = {
    groupId: string;
    senderUserId: string;
    senderDisplayName: string;
    type?: "text" | "progress_update" | "system";
    text: string;
    progressChapter?: number | null;
    progressPage?: number | null;
};
type GetMessagesInput = {
    groupId: string;
    userId: string;
    before?: string | null;
    limit?: number;
};
type UpdateAnnouncementInput = {
    announcementId: string;
    ownerUserId: string;
    message?: string | null;
    currentChapter?: number | null;
    currentPage?: number | null;
    maxMembers?: number;
};
export declare function postAnnouncement(input: PostAnnouncementInput): Promise<IBuddyAnnouncement>;
export declare function getBoard(currentUserId?: string): Promise<IBuddyAnnouncement[]>;
export declare function getMyAnnouncements(ownerUserId: string): Promise<IBuddyAnnouncement[]>;
export declare function removeAnnouncement(announcementId: string, ownerUserId: string): Promise<void>;
export declare function updateAnnouncement(input: UpdateAnnouncementInput): Promise<IBuddyAnnouncement>;
export declare function requestToJoin(input: RequestToJoinInput, io: SocketIOServer): Promise<IBuddyGroup>;
export declare function respondToJoinRequest(input: RespondToJoinRequestInput, io: SocketIOServer): Promise<IBuddyGroup>;
export declare function leaveGroup(input: LeaveGroupInput, io: SocketIOServer): Promise<void>;
export declare function getGroup(groupId: string, userId: string): Promise<IBuddyGroup>;
export declare function getMyGroup(userId: string): Promise<IBuddyGroup | null>;
export declare function sendMessage(input: SendMessageInput, io: SocketIOServer): Promise<IBuddyMessage>;
export declare function getMessages(input: GetMessagesInput): Promise<IBuddyMessage[]>;
export {};
//# sourceMappingURL=buddy-service.d.ts.map
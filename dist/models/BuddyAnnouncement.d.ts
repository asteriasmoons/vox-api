import { Document, Model } from "mongoose";
export interface IBuddyAnnouncement extends Document {
    ownerUserId: string;
    ownerDisplayName: string;
    bookTitle: string;
    bookAuthor: string | null;
    bookCoverUrl: string | null;
    bookKey: string | null;
    message: string | null;
    currentChapter: number | null;
    currentPage: number | null;
    maxMembers: number;
    groupId: string | null;
    isActive: boolean;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const BuddyAnnouncement: Model<IBuddyAnnouncement>;
//# sourceMappingURL=BuddyAnnouncement.d.ts.map
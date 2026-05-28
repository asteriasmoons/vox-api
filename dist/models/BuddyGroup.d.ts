import { Document, Model } from "mongoose";
export type BuddyMemberStatus = "pending" | "joined" | "left";
export interface IBuddyMember {
    userId: string;
    displayName: string;
    status: BuddyMemberStatus;
    isOwner: boolean;
    joinedAt: Date | null;
    requestedAt: Date;
}
export interface IBuddyGroup extends Document {
    announcementId: string;
    bookTitle: string;
    bookAuthor: string | null;
    bookCoverUrl: string | null;
    bookKey: string | null;
    maxMembers: number;
    members: IBuddyMember[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const BuddyGroup: Model<IBuddyGroup>;
//# sourceMappingURL=BuddyGroup.d.ts.map
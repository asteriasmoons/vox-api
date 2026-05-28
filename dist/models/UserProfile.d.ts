import { Document, Model } from "mongoose";
export interface IUserProfile extends Document {
    userId: string;
    displayName: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const UserProfile: Model<IUserProfile>;
//# sourceMappingURL=UserProfile.d.ts.map
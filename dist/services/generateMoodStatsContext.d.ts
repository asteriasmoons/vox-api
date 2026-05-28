export type MoodStatsBehaviorKey = "screenTime" | "socialUsage" | "nighttimeUse" | "pickups" | "notifications";
export interface MoodStatsSummaryInput {
    averageMoodPercent: number;
    checkInCount: number;
    bestDay: string;
    hardestDay: string;
}
export interface MoodStatsPhoneBehaviorInput {
    screenTimeMinutes: number;
    socialAppMinutes: number;
    nighttimePhoneMinutes: number;
    pickupCount: number;
    notificationCount: number;
}
export interface MoodStatsRecentSnapshotInput extends MoodStatsPhoneBehaviorInput {
    date: string;
    averageMoodPercent: number;
    checkInCount: number;
}
export interface MoodStatsContextRequest {
    userId?: string;
    date: string;
    moodSummary: MoodStatsSummaryInput;
    phoneBehavior: MoodStatsPhoneBehaviorInput;
    recentSnapshots?: MoodStatsRecentSnapshotInput[];
}
export interface MoodStatsBehaviorInsight {
    key: MoodStatsBehaviorKey;
    insight: string;
}
export interface MoodStatsContextResponse {
    summary: string;
    behaviors: MoodStatsBehaviorInsight[];
    generatedAt: string;
}
export declare function generateMoodStatsContext(input: MoodStatsContextRequest): Promise<MoodStatsContextResponse>;
//# sourceMappingURL=generateMoodStatsContext.d.ts.map
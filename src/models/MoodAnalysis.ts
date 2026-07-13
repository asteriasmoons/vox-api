import { Schema, model, Document, Model } from "mongoose";
import { lunixiaDB } from "../config/databases";

export interface MoodAnalysisDoc extends Document {
  userId: string;
  moodEntryId: string;
  timestamp: string; // ISO date of the mood log
  mindset: string;
  emotionalBalance: string;
  influences: string;
  reflection: string;
  themes: string[];
  emotions: string[];
  activities: string[];
  createdAt: Date;
  updatedAt: Date;
}

const MoodAnalysisSchema = new Schema<MoodAnalysisDoc>(
  {
    userId: { type: String, required: true, index: true },
    moodEntryId: { type: String, required: true, index: true },
    timestamp: { type: String, required: true },
    mindset: { type: String, required: true },
    emotionalBalance: { type: String, required: true },
    influences: { type: String, required: true },
    reflection: { type: String, required: true },
    themes: { type: [String], default: [] },
    emotions: { type: [String], default: [] },
    activities: { type: [String], default: [] },
  },
  { timestamps: true },
);

MoodAnalysisSchema.index({ userId: 1, moodEntryId: 1 });

export const MoodAnalysis: Model<MoodAnalysisDoc> =
  (lunixiaDB.models.MoodAnalysis as Model<MoodAnalysisDoc>) ||
  lunixiaDB.model<MoodAnalysisDoc>("MoodAnalysis", MoodAnalysisSchema);

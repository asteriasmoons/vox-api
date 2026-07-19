import { Schema, Document, Model } from "mongoose";
import { asteriumDB } from "../config/databases";
import type {
  PractitionerLevel,
  SpellCategoryId,
  SpellIngredient,
  SpellStep,
} from "../services/spellEngineService";

export interface SpellEntryDoc extends Document {
  category: SpellCategoryId;
  categoryTitle: string;
  intention: string;
  level: PractitionerLevel;
  context: string;
  normalizedContext: string;
  title: string;
  focus: string;
  bestTiming: string;
  ingredients: SpellIngredient[];
  tools: string[];
  preparation: string;
  instructions: SpellStep[];
  affirmation: string;
  visualization: string;
  closing: string;
  aftercare: string;
  duration: string;
  notes: string;
  source: "ai";
  createdAt: Date;
  updatedAt: Date;
}

const SpellIngredientSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    purpose: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const SpellStepSchema = new Schema(
  {
    step: { type: Number, required: true },
    instruction: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const SpellEntrySchema = new Schema<SpellEntryDoc>(
  {
    category: { type: String, required: true, index: true },
    categoryTitle: { type: String, required: true, trim: true },
    intention: { type: String, required: true, index: true, trim: true },
    level: { type: String, required: true, index: true },
    context: { type: String, required: true, trim: true },
    normalizedContext: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    focus: { type: String, required: true, trim: true },
    bestTiming: { type: String, required: true, trim: true },
    ingredients: { type: [SpellIngredientSchema], default: [] },
    tools: { type: [String], default: [] },
    preparation: { type: String, required: true, trim: true },
    instructions: { type: [SpellStepSchema], default: [] },
    affirmation: { type: String, required: true, trim: true },
    visualization: { type: String, required: true, trim: true },
    closing: { type: String, required: true, trim: true },
    aftercare: { type: String, required: true, trim: true },
    duration: { type: String, required: true, trim: true },
    notes: { type: String, default: "" },
    source: { type: String, required: true, default: "ai" },
  },
  { timestamps: true },
);

SpellEntrySchema.index(
  {
    category: 1,
    intention: 1,
    level: 1,
    normalizedContext: 1,
  },
  { unique: true },
);

export const SpellEntry: Model<SpellEntryDoc> =
  (asteriumDB.models.SpellEntry as Model<SpellEntryDoc>) ||
  asteriumDB.model<SpellEntryDoc>("SpellEntry", SpellEntrySchema);

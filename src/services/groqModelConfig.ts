const DEFAULT_RECOMMENDATION_GROQ_MODEL = "groq/compound";
const DEFAULT_RECOMMENDATION_COLLECTION_GROQ_MODEL = "groq/compound";

export function recommendationGroqModel(): string {
  return DEFAULT_RECOMMENDATION_GROQ_MODEL;
}

export function recommendationCollectionGroqModel(): string {
  return DEFAULT_RECOMMENDATION_COLLECTION_GROQ_MODEL;
}

export function bookDescriptionGroqModel(): string {
  return process.env.BOOK_DESCRIPTION_GROQ_MODEL || recommendationGroqModel();
}

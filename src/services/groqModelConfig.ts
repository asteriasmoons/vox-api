const DEFAULT_RECOMMENDATION_GROQ_MODEL = "llama-3.3-70b-versatile";

export function recommendationGroqModel(): string {
  return (
    process.env.RECOMMENDATION_GROQ_MODEL ||
    process.env.GROQ_RECOMMENDATION_MODEL ||
    DEFAULT_RECOMMENDATION_GROQ_MODEL
  );
}

export function bookDescriptionGroqModel(): string {
  return process.env.BOOK_DESCRIPTION_GROQ_MODEL || recommendationGroqModel();
}

import { Router } from "express";

const router = Router();

const HARDCOVER_GRAPHQL_URL = "https://api.hardcover.app/v1/graphql";

type HardcoverBook = {
  id?: number;
  title?: string | null;
  subtitle?: string | null;
  description?: string | null;
  headline?: string | null;
  slug?: string | null;
  pages?: number | null;
  release_year?: number | null;
  rating?: number | string | null;
  ratings_count?: number | null;
  users_count?: number | null;
  users_read_count?: number | null;
  cached_contributors?: unknown;
  cached_image?: unknown;
  cached_tags?: unknown;
};

type LumeyBookRec = {
  title: string;
  author: string;
  summary: string;
  hardcoverId?: number | undefined;
  hardcoverUrl?: string | undefined;
  coverUrl?: string | undefined;
  pages?: number | undefined;
  releaseYear?: number | undefined;
  rating?: number | undefined;
  ratingsCount?: number | undefined;
  readersCount?: number | undefined;
  tags?: string[] | undefined;
};

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function firstNumber(value: unknown): number | undefined {
  const num = typeof value === "string" ? Number(value) : value;
  return typeof num === "number" && Number.isFinite(num) ? num : undefined;
}

function getContributorName(contributor: unknown): string {
  if (!contributor || typeof contributor !== "object") return "";

  const record = contributor as Record<string, unknown>;
  const author = record.author;

  if (author && typeof author === "object") {
    const authorName = cleanText((author as Record<string, unknown>).name);
    if (authorName) return authorName;
  }

  return (
    cleanText(record.name) ||
    cleanText(record.author_name) ||
    cleanText(record.contributor_name)
  );
}

function getAuthors(cachedContributors: unknown): string {
  if (!Array.isArray(cachedContributors)) return "";

  const names = cachedContributors
    .map(getContributorName)
    .filter(Boolean)
    .filter((name, index, arr) => arr.indexOf(name) === index);

  return names.slice(0, 3).join(", ");
}

function getCoverUrl(cachedImage: unknown): string | undefined {
  if (!cachedImage || typeof cachedImage !== "object") return undefined;

  const image = cachedImage as Record<string, unknown>;
  return (
    cleanText(image.url) ||
    cleanText(image.image_url) ||
    cleanText(image.medium) ||
    cleanText(image.large) ||
    undefined
  );
}

function collectTagsFromValue(value: unknown, tags = new Set<string>()): Set<string> {
  if (!value) return tags;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed && trimmed.length <= 40) tags.add(trimmed);
    return tags;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectTagsFromValue(item, tags));
    return tags;
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;

    for (const key of ["tag", "name", "label", "category"]) {
      collectTagsFromValue(record[key], tags);
    }

    for (const nestedKey of ["Genre", "Mood", "genres", "moods", "tags"]) {
      collectTagsFromValue(record[nestedKey], tags);
    }
  }

  return tags;
}

function getTags(cachedTags: unknown): string[] {
  return Array.from(collectTagsFromValue(cachedTags)).slice(0, 12);
}

function toLumeyRec(book: HardcoverBook): LumeyBookRec | null {
  const title = cleanText(book.title);
  if (!title) return null;

  const desc = cleanText(book.description) || cleanText(book.headline);
  const summary = desc
    ? desc.length > 1500
      ? desc.slice(0, 1500).trim() + "…"
      : desc
    : "No description available.";

  const slug = cleanText(book.slug);
  const rating = firstNumber(book.rating);

  return {
    title,
    author: getAuthors(book.cached_contributors),
    summary,
    hardcoverId: book.id,
    hardcoverUrl: slug ? `https://hardcover.app/books/${slug}` : undefined,
    coverUrl: getCoverUrl(book.cached_image),
    pages: firstNumber(book.pages),
    releaseYear: firstNumber(book.release_year),
    rating,
    ratingsCount: firstNumber(book.ratings_count),
    readersCount: firstNumber(book.users_read_count) ?? firstNumber(book.users_count),
    tags: getTags(book.cached_tags),
  };
}

async function hardcoverGraphQL<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const apiKey = process.env.HARDCOVER_API_KEY || "";

  if (!apiKey) {
    throw new Error("Missing HARDCOVER_API_KEY environment variable");
  }

  const response = await fetch(HARDCOVER_GRAPHQL_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  const json: any = await response.json().catch(() => null);

  if (!response.ok || json?.errors?.length) {
    console.error("Hardcover GraphQL error:", {
      status: response.status,
      statusText: response.statusText,
      errors: json?.errors,
      body: json,
    });
    throw new Error("Failed to fetch Hardcover recommendations");
  }

  return json?.data as T;
}

/**
 * POST /api/books/recs
 * body: { genre: string }
 *
 * Returns: { recs: [{ title, author, summary }] }
 */
router.post("/", async (req, res) => {
  try {
    const genreRaw = String(req.body?.genre || "").trim();
    if (!genreRaw) {
      return res.status(400).json({ error: "Genre is required" });
    }

    const genre = genreRaw.slice(0, 60);
    const genrePattern = `%${genre}%`;

    const query = `
      query LumeyBookRecommendations($genrePattern: String!, $limit: Int!) {
        books(
          where: {
            _and: [
              { title: { _is_null: false } }
              { is_partial_book: { _eq: false } }
              {
                _or: [
                  { cached_tags: { _cast: { String: { _ilike: $genrePattern } } } }
                  { title: { _ilike: $genrePattern } }
                  { subtitle: { _ilike: $genrePattern } }
                  { description: { _ilike: $genrePattern } }
                  { headline: { _ilike: $genrePattern } }
                ]
              }
            ]
          }
          order_by: [
            { users_read_count: desc_nulls_last }
            { rating: desc_nulls_last }
            { ratings_count: desc_nulls_last }
          ]
          limit: $limit
        ) {
          id
          title
          subtitle
          description
          headline
          slug
          pages
          release_year
          rating
          ratings_count
          users_count
          users_read_count
          cached_contributors
          cached_image
          cached_tags
        }
      }
    `;

    const data = await hardcoverGraphQL<{ books?: HardcoverBook[] }>(query, {
      genrePattern,
      limit: 20,
    });

    const recs = (Array.isArray(data?.books) ? data.books : [])
      .map(toLumeyRec)
      .filter((rec): rec is LumeyBookRec => Boolean(rec))
      .slice(0, 10);

    return res.json({ recs });
  } catch (err) {
    console.error("Recommendations route error:", err);
    return res.status(500).json({ error: "Failed to fetch recommendations" });
  }
});

export default router;

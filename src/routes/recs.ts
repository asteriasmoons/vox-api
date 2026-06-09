import { Router } from "express";

const router = Router();

const BIG_BOOK_API_BASE_URL = "https://api.bigbookapi.com";
const API_LEAGUE_API_BASE_URL = "https://api.apileague.com";
const MIN_RECOMMENDATION_YEAR = 2020;
const SEARCH_CANDIDATE_COUNT = 30;
const FINAL_RECOMMENDATION_COUNT = 10;

type BigBookAuthor = {
  id?: number;
  name?: string | null;
};

type BigBookRating = {
  average?: number | string | null;
};

type BigBookSearchBook = {
  id?: number;
  title?: string | null;
  subtitle?: string | null;
  image?: string | null;
  authors?: BigBookAuthor[] | null;
  rating?: BigBookRating | null;
};

type BigBookDetailBook = BigBookSearchBook & {
  description?: string | null;
  publish_date?: number | string | null;
  number_of_pages?: number | string | null;
};

type BigBookSearchResponse = {
  available?: number;
  number?: number;
  offset?: number;
  books?: unknown[];
};

type BigBookSimilarResponse = {
  similar_books?: unknown[];
  books?: unknown[];
};

type ApiLeagueSimilarResponse = {
  similar_books?: unknown[];
  books?: unknown[];
};

type LumeyBookRec = {
  title: string;
  author: string;
  summary: string;
  bigBookId?: number | undefined;
  coverUrl?: string | undefined;
  pages?: number | undefined;
  releaseYear?: number | undefined;
  rating?: number | undefined;
  tags?: string[] | undefined;
};

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function firstNumber(value: unknown): number | undefined {
  const num = typeof value === "string" ? Number(value) : value;
  return typeof num === "number" && Number.isFinite(num) ? num : undefined;
}

function normalizeGenre(input: string): string | undefined {
  const value = input.trim().toLowerCase();

  const genreMap: Record<string, string> = {
    action: "action",
    adventure: "adventure",
    biography: "biography",
    classics: "classics",
    contemporary: "contemporary",
    crime: "crime",
    dystopia: "dystopia",
    fantasy: "fantasy",
    fiction: "fiction",
    folklore: "folklore",
    graphic: "graphic_novel",
    "graphic novel": "graphic_novel",
    historical: "historical_fiction",
    "historical fiction": "historical_fiction",
    horror: "horror",
    humor: "humor",
    lgbtq: "lgbtq",
    memoir: "memoir",
    mystery: "mystery",
    mythology: "mythology",
    nonfiction: "nonfiction",
    "non fiction": "nonfiction",
    "non-fiction": "nonfiction",
    occult: "occult",
    paranormal: "paranormal",
    poetry: "poetry",
    romance: "romance",
    scifi: "science_fiction",
    "sci fi": "science_fiction",
    "sci-fi": "science_fiction",
    "science fiction": "science_fiction",
    thriller: "thriller",
    witchcraft: "witchcraft",
    ya: "young_adult",
    "young adult": "young_adult",
  };

  return genreMap[value];
}

function flattenSearchBooks(value: unknown): BigBookSearchBook[] {
  if (!Array.isArray(value)) return [];

  return value
    .flatMap((item) => {
      if (Array.isArray(item)) return item;
      return [item];
    })
    .filter((item): item is BigBookSearchBook => {
      return Boolean(item && typeof item === "object" && cleanText((item as BigBookSearchBook).title));
    });
}

function authorsText(authors: BigBookAuthor[] | null | undefined): string {
  if (!Array.isArray(authors)) return "";

  return authors
    .map((author) => cleanText(author?.name))
    .filter(Boolean)
    .filter((name, index, arr) => arr.indexOf(name) === index)
    .slice(0, 3)
    .join(", ");
}

function toLumeyRec(book: BigBookDetailBook | BigBookSearchBook): LumeyBookRec | null {
  const title = cleanText(book.title);
  if (!title) return null;

  const subtitle = cleanText(book.subtitle);
  const description = cleanText((book as BigBookDetailBook).description);

  const summary = description
    ? description.length > 1500
      ? description.slice(0, 1500).trim() + "…"
      : description
    : subtitle || "No description available.";

  return {
    title,
    author: authorsText(book.authors),
    summary,
    bigBookId: firstNumber(book.id),
    coverUrl: cleanText(book.image) || undefined,
    pages: firstNumber((book as BigBookDetailBook).number_of_pages),
    releaseYear: firstNumber((book as BigBookDetailBook).publish_date),
    rating: firstNumber(book.rating?.average),
    tags: [],
  };
}

async function bigBookFetch<T>(path: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
  const apiKey = process.env.BIG_BOOK_API_KEY || process.env.API_LEAGUE_API_KEY || "";

  if (!apiKey) {
    throw new Error("Missing BIG_BOOK_API_KEY environment variable");
  }

  const url = new URL(`${BIG_BOOK_API_BASE_URL}${path}`);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && String(value).trim()) {
      url.searchParams.set(key, String(value));
    }
  }

  console.log("Big Book request:", url.pathname, Object.fromEntries(url.searchParams.entries()));

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "x-api-key": apiKey,
      Accept: "application/json",
    },
  });

  const text = await response.text();
  const json = text ? JSON.parse(text) : null;

  if (!response.ok) {
    console.error("Big Book API error:", {
      status: response.status,
      statusText: response.statusText,
      body: json,
    });

    throw new Error(
      JSON.stringify({
        status: response.status,
        statusText: response.statusText,
        body: json,
      })
    );
  }

  return json as T;
}

async function apiLeagueFetch<T>(path: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
  const apiKey = process.env.API_LEAGUE_API_KEY || "";

  if (!apiKey) {
    throw new Error("Missing API_LEAGUE_API_KEY environment variable");
  }

  const url = new URL(`${API_LEAGUE_API_BASE_URL}${path}`);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && String(value).trim()) {
      url.searchParams.set(key, String(value));
    }
  }

  console.log("API League request:", url.pathname, Object.fromEntries(url.searchParams.entries()));

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "x-api-key": apiKey,
      Accept: "application/json",
    },
  });

  const text = await response.text();
  const json = text ? JSON.parse(text) : null;

  if (!response.ok) {
    console.error("API League API error:", {
      status: response.status,
      statusText: response.statusText,
      body: json,
    });

    throw new Error(
      JSON.stringify({
        status: response.status,
        statusText: response.statusText,
        body: json,
      })
    );
  }

  return json as T;
}

async function fetchBookDetails(book: BigBookSearchBook): Promise<BigBookDetailBook | BigBookSearchBook> {
  const id = firstNumber(book.id);
  if (!id) return book;

  try {
    return await bigBookFetch<BigBookDetailBook>(`/${id}`);
  } catch (error) {
    console.error("Big Book detail fetch failed:", error);
    return book;
  }
}

async function fetchSimilarBooks(book: BigBookSearchBook): Promise<BigBookSearchBook[]> {
  const id = firstNumber(book.id);
  if (!id) return [];

  try {
    const similarData = await bigBookFetch<BigBookSimilarResponse>(`/${id}/similar`);
    const rawSimilarBooks = similarData.similar_books ?? similarData.books ?? [];
    return flattenSearchBooks(rawSimilarBooks);
  } catch (error) {
    console.error("Big Book similar fetch failed:", error);
    return [];
  }
}

async function fetchApiLeagueSimilarBooks(book: BigBookSearchBook): Promise<BigBookSearchBook[]> {
  const id = firstNumber(book.id);
  if (!id) return [];

  try {
    const similarData = await apiLeagueFetch<ApiLeagueSimilarResponse>("/list-similar-books", {
      id,
    });

    const rawSimilarBooks = similarData.similar_books ?? similarData.books ?? [];
    return flattenSearchBooks(rawSimilarBooks);
  } catch (error) {
    console.error("API League similar-books fetch failed:", error);
    return [];
  }
}

function dedupeRecommendations(recs: LumeyBookRec[]): LumeyBookRec[] {
  const seen = new Set<string>();

  return recs.filter((rec) => {
    const key = `${rec.title.toLowerCase()}|${rec.author.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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

    const genre = genreRaw.slice(0, 80);
    const normalizedGenre = normalizeGenre(genre);
    const query = normalizedGenre ? `popular ${genre} books` : genre;

    const searchData = await bigBookFetch<BigBookSearchResponse>("/search-books", {
      query,
      genres: normalizedGenre,
      number: SEARCH_CANDIDATE_COUNT,
      offset: 0,
    });

    const searchBooks = flattenSearchBooks(searchData.books);

    console.log("Big Book available:", searchData.available ?? 0);
    console.log("Big Book usable search books:", searchBooks.length);

    const detailedBooks = await Promise.all(
      searchBooks.slice(0, SEARCH_CANDIDATE_COUNT).map(fetchBookDetails)
    );

    const mappedRecs = detailedBooks
      .map(toLumeyRec)
      .filter((rec): rec is LumeyBookRec => Boolean(rec));

    console.log(
      "Big Book recommendation years:",
      mappedRecs.map((rec) => ({ title: rec.title, releaseYear: rec.releaseYear ?? null }))
    );

    let recs = mappedRecs
      .filter((rec) => typeof rec.releaseYear === "number" && rec.releaseYear >= MIN_RECOMMENDATION_YEAR)
      .slice(0, FINAL_RECOMMENDATION_COUNT);

    console.log("Big Book recommendations after year filter:", recs.length);

    if (recs.length < FINAL_RECOMMENDATION_COUNT && searchBooks.length > 0) {
      console.log("Big Book recommendation count low. Trying similar-books fallback.");

      const similarSeeds = searchBooks.slice(0, 3);
      const similarBooksNested = await Promise.all(similarSeeds.map(fetchSimilarBooks));
      const similarBooks = similarBooksNested.flat();

      console.log("Big Book similar books returned:", similarBooks.length);

      const similarDetails = await Promise.all(
        similarBooks.slice(0, SEARCH_CANDIDATE_COUNT).map(fetchBookDetails)
      );

      const similarRecs = similarDetails
        .map(toLumeyRec)
        .filter((rec): rec is LumeyBookRec => Boolean(rec))
        .filter((rec) => typeof rec.releaseYear === "number" && rec.releaseYear >= MIN_RECOMMENDATION_YEAR);

      recs = dedupeRecommendations([...recs, ...similarRecs]).slice(0, FINAL_RECOMMENDATION_COUNT);

      console.log("Big Book recommendations after similar fallback:", recs.length);
    }

    if (recs.length < FINAL_RECOMMENDATION_COUNT && searchBooks.length > 0) {
      console.log("Recommendation count still low. Trying API League similar-books fallback.");

      const apiLeagueSeeds = searchBooks.slice(0, 3);
      const apiLeagueBooksNested = await Promise.all(apiLeagueSeeds.map(fetchApiLeagueSimilarBooks));
      const apiLeagueBooks = apiLeagueBooksNested.flat();

      console.log("API League similar books returned:", apiLeagueBooks.length);

      const apiLeagueDetails = await Promise.all(
        apiLeagueBooks.slice(0, SEARCH_CANDIDATE_COUNT).map(fetchBookDetails)
      );

      const apiLeagueRecs = apiLeagueDetails
        .map(toLumeyRec)
        .filter((rec): rec is LumeyBookRec => Boolean(rec))
        .filter((rec) => typeof rec.releaseYear === "number" && rec.releaseYear >= MIN_RECOMMENDATION_YEAR);

      recs = dedupeRecommendations([...recs, ...apiLeagueRecs]).slice(0, FINAL_RECOMMENDATION_COUNT);

      console.log("Recommendations after API League fallback:", recs.length);
    }

    return res.json({ recs });
  } catch (err) {
    console.error("Recommendations route error:", err);

    const message = err instanceof Error ? err.message : String(err);

    return res.status(500).json({
      error: "Failed to fetch recommendations",
      detail: message,
    });
  }
});

export default router;

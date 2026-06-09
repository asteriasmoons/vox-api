import { Router } from "express";

const router = Router();

const BIG_BOOK_API_BASE_URL = "https://api.bigbookapi.com";

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
      number: 10,
      offset: 0,
    });

    const searchBooks = flattenSearchBooks(searchData.books);

    console.log("Big Book available:", searchData.available ?? 0);
    console.log("Big Book usable search books:", searchBooks.length);

    const detailedBooks = await Promise.all(searchBooks.slice(0, 10).map(fetchBookDetails));

    const recs = detailedBooks
      .map(toLumeyRec)
      .filter((rec): rec is LumeyBookRec => Boolean(rec))
      .slice(0, 10);

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

// src/services/trackLookupService.ts

const MUSICBRAINZ_API = "https://musicbrainz.org/ws/2";
const DISCOGS_API = "https://api.discogs.com";
const USER_AGENT = "OctaviaApp/1.0 (asteriasmoons@outlook.com)";

const LOOKUP_TIMEOUT_MS = 12_000;

export type TrackMetadataResult = {
  title: string;
  artist: string;
  albumTitle?: string;
  genres: string[];
  releaseDate?: string;
  albumArtUrl?: string;
  artistBio?: string;
  similarArtists: string[];
  label?: string;
  duration?: number;
  source: string;
};

type MusicBrainzRecording = {
  id?: string;
  title?: string;
  "artist-credit"?: Array<{
    name?: string;
    artist?: {
      id?: string;
      name?: string;
      disambiguation?: string;
    };
  }>;
  releases?: Array<{
    id?: string;
    title?: string;
    date?: string;
    "release-group"?: {
      id?: string;
      "primary-type"?: string;
    };
    "label-info"?: Array<{
      label?: {
        name?: string;
      };
    }>;
  }>;
  tags?: Array<{
    name?: string;
    count?: number;
  }>;
  length?: number;
};

type MusicBrainzSearchResponse = {
  recordings?: MusicBrainzRecording[];
};

type MusicBrainzArtistResponse = {
  id?: string;
  name?: string;
  disambiguation?: string;
  "life-span"?: {
    begin?: string;
    end?: string;
    ended?: boolean;
  };
  area?: {
    name?: string;
  };
  tags?: Array<{
    name?: string;
    count?: number;
  }>;
  relations?: Array<{
    type?: string;
    url?: {
      resource?: string;
    };
  }>;
};

type DiscogsSearchResult = {
  id?: number;
  title?: string;
  year?: string;
  genre?: string[];
  style?: string[];
  label?: string[];
  cover_image?: string;
  thumb?: string;
  master_id?: number;
};

type DiscogsSearchResponse = {
  results?: DiscogsSearchResult[];
};

type DiscogsArtistResponse = {
  id?: number;
  name?: string;
  profile?: string;
  images?: Array<{
    uri?: string;
    type?: string;
  }>;
  members?: Array<{
    name?: string;
    active?: boolean;
  }>;
};

type DiscogsMasterResponse = {
  id?: number;
  title?: string;
  year?: number;
  genres?: string[];
  styles?: string[];
  images?: Array<{
    uri?: string;
    type?: string;
  }>;
  artists?: Array<{
    name?: string;
    id?: number;
  }>;
};

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

async function fetchWithTimeout<T>(
  url: string | URL,
  headers: Record<string, string>,
): Promise<T | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LOOKUP_TIMEOUT_MS);

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": USER_AGENT,
        ...headers,
      },
      signal: controller.signal,
    });

    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// ── MusicBrainz ──

async function searchMusicBrainz(
  title: string,
  artist: string,
): Promise<TrackMetadataResult | null> {
  const query = `recording:"${title}" AND artist:"${artist}"`;
  const url = new URL(`${MUSICBRAINZ_API}/recording`);
  url.searchParams.set("query", query);
  url.searchParams.set("fmt", "json");
  url.searchParams.set("limit", "5");
  url.searchParams.set("inc", "releases+tags+artist-credits");

  const data = await fetchWithTimeout<MusicBrainzSearchResponse>(url.toString(), {});

  const recordings = data?.recordings ?? [];
  if (recordings.length === 0) return null;

  const best = recordings[0];
  if (!best) return null;

  const artistCredit = best["artist-credit"]?.[0];
  const release = best.releases?.[0];
  const tags = (best.tags ?? [])
    .sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
    .slice(0, 8)
    .map((t) => cleanText(t.name))
    .filter(Boolean);

  const labelInfo = release?.["label-info"]?.[0];

  const result: TrackMetadataResult = {
    title: cleanText(best.title) || title,
    artist: cleanText(artistCredit?.artist?.name) || artist,
    genres: tags,
    similarArtists: [],
    source: "MusicBrainz",
  };

  if (release?.title) result.albumTitle = cleanText(release.title);
  if (release?.date) result.releaseDate = release.date;
  if (labelInfo?.label?.name) result.label = cleanText(labelInfo.label.name);
  if (best.length) result.duration = Math.round(best.length / 1000);

  // Fetch cover art from Cover Art Archive
  if (release?.id) {
    const coverUrl = `https://coverartarchive.org/release/${release.id}/front-250`;
    result.albumArtUrl = coverUrl;
  }

  // Fetch artist details for bio + similar artists
  const artistId = artistCredit?.artist?.id;
  if (artistId) {
    const artistData = await fetchMusicBrainzArtist(artistId);
    if (artistData) {
      if (artistData.bio) result.artistBio = artistData.bio;
      if (artistData.similarArtists.length > 0) {
        result.similarArtists = artistData.similarArtists;
      }
      if (tags.length === 0 && artistData.genres.length > 0) {
        result.genres = artistData.genres;
      }
    }
  }

  return result;
}

async function fetchMusicBrainzArtist(
  artistId: string,
): Promise<{ bio: string; similarArtists: string[]; genres: string[] } | null> {
  const url = `${MUSICBRAINZ_API}/artist/${artistId}?fmt=json&inc=tags+url-rels`;
  const data = await fetchWithTimeout<MusicBrainzArtistResponse>(url, {});
  if (!data) return null;

  const tags = (data.tags ?? [])
    .sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
    .slice(0, 6)
    .map((t) => cleanText(t.name))
    .filter(Boolean);

  const area = cleanText(data.area?.name);
  const lifeSpan = data["life-span"];
  const bioParts: string[] = [];

  if (area) bioParts.push(`From ${area}`);
  if (lifeSpan?.begin) {
    const active = lifeSpan.ended
      ? `Active ${lifeSpan.begin}–${lifeSpan.end ?? "unknown"}`
      : `Active since ${lifeSpan.begin}`;
    bioParts.push(active);
  }
  if (data.disambiguation) bioParts.push(data.disambiguation);

  return {
    bio: bioParts.join(". ") || "",
    similarArtists: [],
    genres: tags,
  };
}

// ── Discogs ──

async function searchDiscogs(
  title: string,
  artist: string,
): Promise<TrackMetadataResult | null> {
  const token = process.env.DISCOGS_TOKEN || "";
  if (!token) return null;

  const url = new URL(`${DISCOGS_API}/database/search`);
  url.searchParams.set("track", title);
  url.searchParams.set("artist", artist);
  url.searchParams.set("type", "master");
  url.searchParams.set("per_page", "5");

  const data = await fetchWithTimeout<DiscogsSearchResponse>(url.toString(), {
    Authorization: `Discogs token=${token}`,
  });

  const results = data?.results ?? [];
  if (results.length === 0) return null;

  const best = results[0];
  if (!best) return null;

  const genres = [
    ...(best.genre ?? []),
    ...(best.style ?? []),
  ]
    .map((g) => cleanText(g))
    .filter(Boolean)
    .slice(0, 8);

  const result: TrackMetadataResult = {
    title,
    artist,
    genres,
    similarArtists: [],
    source: "Discogs",
  };

  const albumParts = cleanText(best.title).split(" - ");
  if (albumParts.length >= 2) {
    result.albumTitle = albumParts.slice(1).join(" - ").trim();
  }

  if (best.year) result.releaseDate = best.year;
  if (best.label?.[0]) result.label = cleanText(best.label[0]);

  const coverImage = best.cover_image || best.thumb;
  if (coverImage && !coverImage.includes("spacer.gif")) {
    result.albumArtUrl = coverImage;
  }

  // Fetch master release for better genre/style data and art
  if (best.master_id) {
    const masterData = await fetchDiscogsMaster(best.master_id, token);
    if (masterData) {
      if (masterData.genres.length > genres.length) {
        result.genres = masterData.genres;
      }
      if (masterData.albumArtUrl) result.albumArtUrl = masterData.albumArtUrl;
      if (masterData.year) result.releaseDate = String(masterData.year);
    }
  }

  // Fetch artist profile for bio
  const artistSearchUrl = new URL(`${DISCOGS_API}/database/search`);
  artistSearchUrl.searchParams.set("q", artist);
  artistSearchUrl.searchParams.set("type", "artist");
  artistSearchUrl.searchParams.set("per_page", "1");

  const artistSearch = await fetchWithTimeout<DiscogsSearchResponse>(
    artistSearchUrl.toString(),
    { Authorization: `Discogs token=${token}` },
  );

  const artistResult = artistSearch?.results?.[0];
  if (artistResult?.id) {
    const artistData = await fetchDiscogsArtist(artistResult.id, token);
    if (artistData?.profile) {
      result.artistBio = artistData.profile;
    }
  }

  return result;
}

async function fetchDiscogsMaster(
  masterId: number,
  token: string,
): Promise<{
  genres: string[];
  albumArtUrl?: string;
  year?: number;
} | null> {
  const url = `${DISCOGS_API}/masters/${masterId}`;
  const data = await fetchWithTimeout<DiscogsMasterResponse>(url, {
    Authorization: `Discogs token=${token}`,
  });
  if (!data) return null;

  const genres = [
    ...(data.genres ?? []),
    ...(data.styles ?? []),
  ]
    .map((g) => cleanText(g))
    .filter(Boolean)
    .slice(0, 8);

  const primaryImage = data.images?.find((img) => img.type === "primary");
  const albumArtUrl = primaryImage?.uri ?? data.images?.[0]?.uri;

  const result: { genres: string[]; albumArtUrl?: string; year?: number } = {
    genres,
  };

  if (albumArtUrl) result.albumArtUrl = albumArtUrl;
  if (data.year != null) result.year = data.year;

  return result;
}

async function fetchDiscogsArtist(
  artistId: number,
  token: string,
): Promise<{ profile?: string } | null> {
  const url = `${DISCOGS_API}/artists/${artistId}`;
  const data = await fetchWithTimeout<DiscogsArtistResponse>(url, {
    Authorization: `Discogs token=${token}`,
  });
  if (!data) return null;

  let profile = cleanText(data.profile);
  // Discogs profiles have [a=Artist Name] markup — strip it
  profile = profile
    .replace(/\[a=([^\]]+)\]/g, "$1")
    .replace(/\[([^\]]+)\]/g, "$1");

  if (profile) return { profile };
  return {};
}

// ── Public API ──

export async function lookupTrackMetadata(
  title: string,
  artist: string,
): Promise<TrackMetadataResult | null> {
  const cleanTitle = cleanText(title);
  const cleanArtist = cleanText(artist);
  if (!cleanTitle) return null;

  // Try MusicBrainz first
  const mbResult = await searchMusicBrainz(cleanTitle, cleanArtist);
  if (mbResult && mbResult.genres.length > 0) {
    // If MusicBrainz returned genres, try Discogs for supplementary data
    const discogsResult = await searchDiscogs(cleanTitle, cleanArtist).catch(
      () => null,
    );
    if (discogsResult) {
      return mergeResults(mbResult, discogsResult);
    }
    return mbResult;
  }

  // MusicBrainz failed or had no genres — try Discogs as primary
  const discogsResult = await searchDiscogs(cleanTitle, cleanArtist);
  if (discogsResult) {
    if (mbResult) {
      return mergeResults(mbResult, discogsResult);
    }
    return discogsResult;
  }

  // Return whatever MusicBrainz had even without genres
  return mbResult;
}

function mergeResults(
  primary: TrackMetadataResult,
  secondary: TrackMetadataResult,
): TrackMetadataResult {
  const mergedGenres = Array.from(
    new Set([...primary.genres, ...secondary.genres]),
  ).slice(0, 10);

  const mergedSimilar = Array.from(
    new Set([...primary.similarArtists, ...secondary.similarArtists]),
  ).slice(0, 8);

  const result: TrackMetadataResult = {
    title: primary.title || secondary.title,
    artist: primary.artist || secondary.artist,
    genres: mergedGenres,
    similarArtists: mergedSimilar,
    source: "MusicBrainz + Discogs",
  };

  const albumTitle = primary.albumTitle || secondary.albumTitle;
  const releaseDate = primary.releaseDate || secondary.releaseDate;
  const albumArtUrl = primary.albumArtUrl || secondary.albumArtUrl;
  const artistBio = primary.artistBio || secondary.artistBio;
  const label = primary.label || secondary.label;
  const duration = primary.duration || secondary.duration;

  if (albumTitle) result.albumTitle = albumTitle;
  if (releaseDate) result.releaseDate = releaseDate;
  if (albumArtUrl) result.albumArtUrl = albumArtUrl;
  if (artistBio) result.artistBio = artistBio;
  if (label) result.label = label;
  if (duration) result.duration = duration;

  return result;
}

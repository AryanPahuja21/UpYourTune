import { NextRequest, NextResponse } from "next/server";
//@ts-expect-error
import youtubesearchapi from "youtube-search-api";

// Helpers to normalize titles and detect duplicates/variants
function cleanTitle(t: string) {
  if (!t) return "";
  let s = t.toLowerCase();
  // remove stuff in parentheses/brackets
  s = s.replace(/\([^)]*\)|\[[^\]]*\]/g, "");
  // common noisy tokens to remove
  const noisy = [
    "lyrics",
    "lyric",
    "official",
    "audio",
    "music video",
    "music",
    "video",
    "hd",
    "live",
    "remix",
    "cover",
    "karaoke",
    "instrumental",
    "visualizer",
    "feat",
    "ft.",
    "feat.",
    "explicit",
    "with lyrics",
  ];
  noisy.forEach((n) => {
    s = s.replace(new RegExp("\\b" + n + "\\b", "g"), "");
  });
  // remove punctuation
  s = s.replace(/[^a-z0-9\s]/g, " ");
  // collapse spaces
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

function titleSimilarity(a: string, b: string) {
  if (!a || !b) return 0;
  const A = new Set(a.split(" ").filter((w) => w.length > 2));
  const B = new Set(b.split(" ").filter((w) => w.length > 2));
  if (A.size === 0 || B.size === 0) return 0;
  let common = 0;
  A.forEach((w) => {
    if (B.has(w)) common++;
  });
  return common / Math.min(A.size, B.size);
}

function pickUniqueByTitle(items: any[], max: number, referenceTitle = "") {
  const out: any[] = [];
  const norms: string[] = [];
  const refNorm = cleanTitle(referenceTitle);

  for (const it of items) {
    const norm = cleanTitle(it.title || "");
    // skip if it's the same as the reference (high similarity)
    if (refNorm && titleSimilarity(refNorm, norm) >= 0.7) continue;
    // skip obvious duplicates/variants (high similarity to already chosen)
    const isDup = norms.some((n) => titleSimilarity(n, norm) >= 0.7);
    if (isDup) continue;
    out.push(it);
    norms.push(norm);
    if (out.length >= max) break;
  }

  return out;
}

function extractArtistAndSong(fullTitle: string) {
  // heuristics: split on " - ", or on " — " etc.
  if (!fullTitle) return { artist: "", song: fullTitle };
  const parts = fullTitle.split(/ - | — |\|/).map((p) => p.trim());
  if (parts.length >= 2) {
    // ambiguous which is artist vs song; we'll return both possibilities
    return { artist: parts[0], song: parts.slice(1).join(" - ") };
  }
  return { artist: "", song: fullTitle };
}

export async function GET(req: NextRequest) {
  try {
    const videoId = req.nextUrl.searchParams.get("videoId");
    const title = req.nextUrl.searchParams.get("title") || "";
    const maxResults = parseInt(req.nextUrl.searchParams.get("max") || "8", 10);

    if (!videoId && !title) {
      return NextResponse.json(
        { message: "Missing videoId or title" },
        { status: 400 }
      );
    }

    const YT_API_KEY = process.env.YOUTUBE_API_KEY;

    // First try: relatedToVideoId (YouTube Data API)
    let candidates: any[] = [];

    if (YT_API_KEY && videoId) {
      try {
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&relatedToVideoId=${videoId}&type=video&maxResults=${Math.max(
          8,
          maxResults
        )}&key=${YT_API_KEY}`;
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          candidates = (json.items || [])
            .map((it: any) => ({
              id: it.id?.videoId,
              title: it.snippet?.title || "",
              smallImg: it.snippet?.thumbnails?.default?.url || null,
              bigImg:
                it.snippet?.thumbnails?.high?.url ||
                it.snippet?.thumbnails?.default?.url ||
                null,
              url: `https://www.youtube.com/watch?v=${it.id?.videoId}`,
              extractedId: it.id?.videoId,
              channelId: it.snippet?.channelId,
            }))
            .filter(Boolean);
        } else {
          console.warn(
            "YouTube Data API failed for recommendations:",
            res.status
          );
        }
      } catch (e) {
        console.warn("YouTube Data API error for recommendations:", e);
      }
    }

    // Normalize and pick unique items, filtering out lyric/live/remix variants
    const normalized = pickUniqueByTitle(candidates, maxResults, title);

    // If not enough results, supplement with artist-based and "songs like" searches
    let results = [...normalized];
    if (results.length < maxResults) {
      const need = maxResults - results.length;
      const { artist, song } = extractArtistAndSong(title);
      const supplementQueries: string[] = [];
      if (artist) supplementQueries.push(`${artist} music`);
      if (artist) supplementQueries.push(`top songs ${artist}`);
      if (song) supplementQueries.push(`songs like ${song}`);
      supplementQueries.push(`${title}`);

      for (const q of supplementQueries) {
        if (results.length >= maxResults) break;
        try {
          if (YT_API_KEY) {
            const qurl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(
              q
            )}&maxResults=${Math.max(8, need)}&key=${YT_API_KEY}`;
            const r = await fetch(qurl);
            if (!r.ok) continue;
            const j = await r.json();
            const items = (j.items || [])
              .map((it: any) => ({
                id: it.id?.videoId,
                title: it.snippet?.title || "",
                smallImg: it.snippet?.thumbnails?.default?.url || null,
                bigImg:
                  it.snippet?.thumbnails?.high?.url ||
                  it.snippet?.thumbnails?.default?.url ||
                  null,
                url: `https://www.youtube.com/watch?v=${it.id?.videoId}`,
                extractedId: it.id?.videoId,
                channelId: it.snippet?.channelId,
              }))
              .filter(Boolean);

            const unique = pickUniqueByTitle(items, need, title).filter(
              (it) => !results.find((r) => r.extractedId === it.extractedId)
            );
            results.push(...unique.slice(0, need));
          } else {
            // fallback to youtube-search-api
            // the package sometimes returns different shapes; we normalize below
            const res: any = await youtubesearchapi.GetListByKeyword(q);
            let rawItems: any[] = [];
            if (!res) rawItems = [];
            else if (Array.isArray(res)) rawItems = res;
            else if (Array.isArray(res.items)) rawItems = res.items;
            else if (Array.isArray(res.contents)) rawItems = res.contents;
            else if (Array.isArray(res.video)) rawItems = res.video;
            else if (Array.isArray(res.results)) rawItems = res.results;
            else
              rawItems = Object.values(res)
                .filter((v) => Array.isArray(v))
                .flat();

            const items = rawItems
              .map((it: any) => {
                const id =
                  it.id ||
                  it.videoId ||
                  it?.id?.videoId ||
                  it?.video?.videoId ||
                  (it?.data && it.data.videoId) ||
                  null;
                const t =
                  it.snippet?.title ||
                  it.title ||
                  it.name ||
                  it?.headline ||
                  it?.data?.title ||
                  "";
                const thumbnails =
                  it.snippet?.thumbnails ||
                  it.thumbnail ||
                  it.thumbnail?.thumbnails ||
                  it?.thumbnails ||
                  null;
                const smallImg =
                  thumbnails?.default?.url || thumbnails?.[0]?.url || null;
                const bigImg =
                  thumbnails?.high?.url ||
                  thumbnails?.[thumbnails?.length - 1]?.url ||
                  smallImg;
                return id
                  ? {
                      id,
                      title: t,
                      smallImg,
                      bigImg,
                      url: `https://www.youtube.com/watch?v=${id}`,
                      extractedId: id,
                    }
                  : null;
              })
              .filter(Boolean);

            const unique = pickUniqueByTitle(items, need, title).filter(
              (it) => !results.find((r) => r.extractedId === it.extractedId)
            );
            results.push(...unique.slice(0, need));
          }
        } catch (e) {
          console.warn(
            "Supplemental recommendation search failed for query:",
            q,
            e
          );
        }
      }
    }

    // Final trimming and normalization of returned shape
    const final = results
      .filter((r) => r && r.extractedId)
      .slice(0, maxResults)
      .map((r) => ({
        id: r.id || r.extractedId,
        title: r.title,
        smallImg: r.smallImg,
        bigImg: r.bigImg,
        url: r.url,
        extractedId: r.extractedId,
      }));

    return NextResponse.json({ recommendations: final });
  } catch (e: any) {
    console.error("Error in recommendations route:", e);
    return NextResponse.json(
      { message: "Failed to fetch recommendations", error: e.message },
      { status: 500 }
    );
  }
}

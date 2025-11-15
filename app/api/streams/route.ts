import { prismaClient } from "@/app/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
//@ts-expect-error
import youtubesearchapi from "youtube-search-api";
import { getServerSession } from "next-auth";
import { YT_REGEX } from "@/app/lib/utils";
import { checkCanAddStream } from "@/app/lib/subscription";

const CreateStreamSchema = z.object({
  creatorId: z.string(),
  url: z.string(),
});

// Helper function to fetch YouTube details with timeout
async function fetchYoutubeDetailsWithTimeout(
  extractedId: string,
  timeoutMs: number = 3000
) {
  return Promise.race([
    youtubesearchapi.GetVideoDetails(extractedId),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("YouTube API timeout")), timeoutMs)
    ),
  ]);
}

export async function POST(req: NextRequest) {
  try {
    // Get session first
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
    }

    // Get user from database
    const user = await prismaClient.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Parse and validate incoming data
    const data = CreateStreamSchema.parse(await req.json());
    const match = data.url.match(YT_REGEX);

    if (!match) {
      return NextResponse.json({ message: "Invalid URL" }, { status: 403 });
    }

    // CHECK SUBSCRIPTION LIMITS BEFORE ADDING STREAM
    console.log(
      `[Streams API] Checking subscription limits for creator: ${data.creatorId}`
    );
    const limitCheck = await checkCanAddStream(user.id, data.creatorId);

    if (!limitCheck.canAdd) {
      console.log(`[Streams API] Limit check failed: ${limitCheck.reason}`);
      return NextResponse.json(
        {
          message: limitCheck.reason,
          limitReached: true,
          currentCount: limitCheck.currentCount,
          limit: limitCheck.limit,
          plan: limitCheck.plan,
          upgradeMessage:
            limitCheck.plan === "FREE"
              ? "Upgrade to BASIC ($9.99/month) for 20 songs or PREMIUM ($19.99/month) for unlimited songs!"
              : limitCheck.plan === "BASIC"
              ? "Upgrade to PREMIUM ($19.99/month) for unlimited songs!"
              : "You've reached your queue limit.",
        },
        { status: 403 }
      );
    }

    console.log(
      `[Streams API] Limit check passed. Current: ${limitCheck.currentCount}/${limitCheck.limit}`
    );

    const extractedId = match[1];
    console.log("Extracted Video ID:", extractedId);

    // Server-side embeddability check using YouTube Data API v3. If a
    // YOUTUBE_API_KEY is provided in env, query the video's status and
    // reject streams that have embedding disabled by the owner. If the
    // API call fails (quota/network), fall back to allowing the add so we
    // don't block users due to transient API issues.
    const YT_API_KEY = process.env.YOUTUBE_API_KEY;
    if (YT_API_KEY) {
      try {
        const ytRes = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=status&id=${extractedId}&key=${YT_API_KEY}`
        );
        if (ytRes.ok) {
          const ytJson = await ytRes.json();
          const item = ytJson.items && ytJson.items[0];
          if (!item) {
            return NextResponse.json(
              { message: "Video not found." },
              { status: 404 }
            );
          }

          const embeddable = item.status?.embeddable;
          if (embeddable === false) {
            return NextResponse.json(
              {
                message:
                  "Embedding for this video has been disabled by the owner.",
              },
              { status: 403 }
            );
          }
        } else {
          // Non-OK from YouTube API: log and continue (don't block add)
          console.warn("YouTube API returned non-OK status:", ytRes.status);
        }
      } catch (e) {
        console.warn("YouTube embeddability check failed, continuing:", e);
      }
    }

    // Default values in case API fails or times out
    const defaultSmallImg = `https://img.youtube.com/vi/${extractedId}/default.jpg`;
    const defaultBigImg = `https://img.youtube.com/vi/${extractedId}/maxresdefault.jpg`;
    let title = "YouTube Video";
    let smallImg = defaultSmallImg;
    let bigImg = defaultBigImg;

    // Try to fetch YouTube details with timeout
    try {
      const res = await fetchYoutubeDetailsWithTimeout(extractedId, 3000);
      console.log("API Response:", res);

      const thumbnails = res?.thumbnail?.thumbnails ?? [];
      thumbnails.sort((a: { width: number }, b: { width: number }) =>
        a.width < b.width ? -1 : 1
      );

      smallImg =
        thumbnails.length > 1
          ? thumbnails[thumbnails.length - 2].url
          : thumbnails[0]?.url ?? defaultSmallImg;

      bigImg =
        thumbnails.length > 0
          ? thumbnails[thumbnails.length - 1].url
          : defaultBigImg;

      title = res.title ?? "YouTube Video";
    } catch (apiError) {
      console.warn("YouTube API failed, using default values:", apiError);
      // Continue with default values
    }

    const stream = await prismaClient.stream.create({
      data: {
        userId: data.creatorId,
        url: data.url,
        extractedId,
        type: "Youtube",
        title,
        smallImg,
        bigImg,
      },
    });

    return NextResponse.json({
      message: "Stream added successfully",
      id: stream.id,
      stream: {
        id: stream.id,
        title: stream.title,
        smallImg: stream.smallImg,
        bigImg: stream.bigImg,
        upvotes: 0,
        haveUpvoted: false,
      },
    });
  } catch (e: any) {
    console.error("Error while adding a stream:", e);
    return NextResponse.json(
      {
        message: "Error while adding a stream",
        error: e.message,
      },
      {
        status: 500,
      }
    );
  }
}

export async function GET(req: NextRequest) {
  const creatorId = req.nextUrl.searchParams.get("creatorId");
  const session = await getServerSession();
  const user = await prismaClient.user.findFirst({
    where: {
      email: session?.user?.email ?? "",
    },
  });

  if (!user) {
    return NextResponse.json(
      {
        message: "Unauthenticated",
      },
      {
        status: 403,
      }
    );
  }
  if (!creatorId) {
    return NextResponse.json(
      {
        message: "Invalid creatorId",
      },
      {
        status: 403,
      }
    );
  }
  const [streams, activeStream] = await Promise.all([
    await prismaClient.stream.findMany({
      where: {
        userId: creatorId,
        played: false,
      },
      include: {
        _count: {
          select: {
            upvotes: true,
          },
        },
        upvotes: {
          where: {
            userId: user.id,
          },
        },
      },
    }),
    await prismaClient.currentStream.findFirst({
      where: {
        userId: creatorId,
      },
      include: {
        stream: true,
      },
    }),
  ]);

  return NextResponse.json({
    streams: streams.map(({ _count, ...rest }) => ({
      ...rest,
      upvotes: _count.upvotes,
      haveUpvoted: rest.upvotes.length ? true : false,
    })),
    activeStream,
  });
}

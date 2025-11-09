import { prismaClient } from "@/app/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
//@ts-expect-error
import youtubesearchapi from "youtube-search-api";
import { getServerSession } from "next-auth";
import { YT_REGEX } from "@/app/lib/utils";

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
    // Parse and validate incoming data
    const data = CreateStreamSchema.parse(await req.json());
    const isYt = data.url.match(YT_REGEX);

    if (!isYt) {
      return NextResponse.json(
        {
          message: "Invalid URL",
        },
        {
          status: 403,
        }
      );
    }

    const extractedId = data.url.split("?v=")[1];
    console.log("Extracted Video ID:", extractedId);

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

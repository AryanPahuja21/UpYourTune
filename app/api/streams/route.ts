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

    // Fetch video details from YouTube API
    const res = await youtubesearchapi.GetVideoDetails(extractedId);

    // Check if the response contains the required properties
    if (!res || !res.thumbnail || !res.thumbnail.thumbnails) {
      return NextResponse.json(
        {
          message: "Thumbnails data is missing in the response",
        },
        {
          status: 404,
        }
      );
    }

    // Safely access and sort thumbnails
    const thumbnails = res.thumbnail.thumbnails;
    thumbnails.sort((a: { width: number }, b: { width: number }) =>
      a.width < b.width ? -1 : 1
    );

    // Create a new stream entry in the database
    const stream = await prismaClient.stream.create({
      data: {
        userId: data.creatorId,
        url: data.url,
        extractedId,
        type: "Youtube",
        title: res.title ?? "Can't fetch title",
        smallImg:
          thumbnails.length > 1
            ? thumbnails[thumbnails.length - 2].url
            : thumbnails[0]?.url ??
              "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?fm=jpg&q=60&w=3000&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8bXVzaWN8ZW58MHx8MHx8fDA%3D",
        bigImg:
          thumbnails.length > 0
            ? thumbnails[thumbnails.length - 1].url
            : "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?fm=jpg&q=60&w=3000&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8bXVzaWN8ZW58MHx8MHx8fDA%3D",
      },
    });

    return NextResponse.json({
      message: "Stream added successfully",
      id: stream.id,
    });
  } catch (e: any) {
    // Return detailed error message
    return NextResponse.json(
      {
        message: "Error while adding a stream",
        error: e.message,
      },
      {
        status: 500, // Changed status code to 500 for server errors
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

import { prismaClient } from "@/app/lib/db";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const UpvoteSchema = z.object({
  userId: z.string(),
  streamId: z.string(),
});

export async function POST(req: NextRequest) {
  console.log("Upvote request");
  console.log(req.json());
  const session = await getServerSession();

  const user = await prismaClient.user.findFirst({
    where: {
      email: session?.user?.email ?? "",
    },
  });

  if (!user) {
    return NextResponse.json(
      {
        message: "Unauthorized",
      },
      {
        status: 401,
      }
    );
  }

  try {
    const data = UpvoteSchema.parse(await req.json());
    await prismaClient.upvote.create({
      data: {
        userId: data.userId,
        streamId: data.streamId,
      },
    });

    return NextResponse.json({
      message: "Upvoted successfully",
    });
  } catch (e) {
    console.log(e);
    return NextResponse.json(
      {
        message: "Error while upvoting",
      },
      {
        status: 403,
      }
    );
  }
}

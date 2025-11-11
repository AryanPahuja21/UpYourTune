import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prismaClient } from "@/app/lib/db";
import {
  getUserSubscription,
  updateSubscriptionPlan,
  getSubscriptionLimits,
  isSubscriptionActive,
  type SubscriptionPlan,
} from "@/app/lib/subscription";
import { z } from "zod";

const UpgradeSubscriptionSchema = z.object({
  plan: z.enum(["FREE", "BASIC", "PREMIUM"]),
});

/**
 * GET /api/subscription
 * Fetch current user's subscription details
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: "Unauthenticated" },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prismaClient.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Get or create subscription
    const subscription = await getUserSubscription(user.id);
    const limits = getSubscriptionLimits(subscription.plan as SubscriptionPlan);
    const active = isSubscriptionActive(subscription);

    // Get current usage
    const currentStreamCount = await prismaClient.stream.count({
      where: {
        userId: user.id,
        played: false,
      },
    });

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        active,
      },
      limits: {
        maxMembers: limits.maxMembers === Infinity ? -1 : limits.maxMembers,
        maxSongs: limits.maxSongs === Infinity ? -1 : limits.maxSongs,
        name: limits.name,
      },
      usage: {
        currentSongs: currentStreamCount,
        currentMembers: 0, // TODO: Implement when member tracking is added
      },
    });
  } catch (error: any) {
    console.error("Error fetching subscription:", error);
    return NextResponse.json(
      { message: "Error fetching subscription", error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/subscription
 * Upgrade/purchase subscription
 * TODO: Integrate with Stripe for actual payment processing
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: "Unauthenticated" },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prismaClient.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const data = UpgradeSubscriptionSchema.parse(await req.json());

    // TODO: STRIPE INTEGRATION
    // 1. Create Stripe Checkout Session
    // 2. Process payment
    // 3. Verify payment success
    // 4. Then update subscription
    // For now, we'll grant the subscription immediately for testing

    console.log(`[Subscription API] User ${user.id} upgrading to ${data.plan}`);

    // Update subscription plan
    const result = await updateSubscriptionPlan(user.id, data.plan);

    if (!result.success) {
      return NextResponse.json(
        { message: result.error || "Failed to update subscription" },
        { status: 500 }
      );
    }

    const limits = getSubscriptionLimits(data.plan);

    return NextResponse.json({
      message: "Subscription updated successfully",
      subscription: {
        id: result.subscription.id,
        plan: result.subscription.plan,
        status: result.subscription.status,
        startDate: result.subscription.startDate,
        endDate: result.subscription.endDate,
      },
      limits: {
        maxMembers: limits.maxMembers,
        maxSongs: limits.maxSongs,
        name: limits.name,
      },
    });
  } catch (error: any) {
    console.error("Error updating subscription:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid request data", errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Error updating subscription", error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/subscription
 * Cancel subscription
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: "Unauthenticated" },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prismaClient.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // TODO: STRIPE INTEGRATION
    // 1. Cancel Stripe subscription
    // 2. Update database

    await prismaClient.subscription.update({
      where: { userId: user.id },
      data: {
        status: "CANCELLED",
      },
    });

    console.log(`[Subscription API] User ${user.id} cancelled subscription`);

    return NextResponse.json({
      message: "Subscription cancelled successfully",
    });
  } catch (error: any) {
    console.error("Error cancelling subscription:", error);
    return NextResponse.json(
      { message: "Error cancelling subscription", error: error.message },
      { status: 500 }
    );
  }
}

import { prismaClient } from "./db";

// Subscription plan types
export type SubscriptionPlan = "FREE" | "BASIC" | "PREMIUM";
export type SubscriptionStatus = "ACTIVE" | "CANCELLED" | "EXPIRED";

// Subscription limits configuration
export const SUBSCRIPTION_LIMITS = {
  FREE: {
    maxMembers: 5,
    maxSongs: 5,
    price: 0,
    name: "Free",
    features: [
      "Up to 5 members per room",
      "Up to 5 songs in queue",
      "Basic voting features",
      "YouTube integration",
    ],
  },
  BASIC: {
    maxMembers: 20,
    maxSongs: 20,
    price: 9.99,
    name: "Basic",
    features: [
      "Up to 20 members per room",
      "Up to 20 songs in queue",
      "Priority support",
      "Advanced voting features",
      "YouTube integration",
      "Remove ads",
    ],
  },
  PREMIUM: {
    maxMembers: Infinity,
    maxSongs: Infinity,
    price: 19.99,
    name: "Premium",
    features: [
      "Unlimited members per room",
      "Unlimited songs in queue",
      "Priority support 24/7",
      "Advanced voting features",
      "YouTube & Spotify integration",
      "Remove ads",
      "Custom branding",
      "Analytics dashboard",
    ],
  },
};

/**
 * Get subscription limits for a given plan
 */
export function getSubscriptionLimits(plan: SubscriptionPlan): {
  maxMembers: number;
  maxSongs: number;
  price: number;
  name: string;
  features: string[];
} {
  return SUBSCRIPTION_LIMITS[plan] || SUBSCRIPTION_LIMITS.FREE;
}

/**
 * Check if a subscription is currently active
 */
export function isSubscriptionActive(subscription: {
  status: SubscriptionStatus;
  endDate?: Date | null;
}): boolean {
  if (subscription.status !== "ACTIVE") {
    return false;
  }

  // If there's an end date, check if it's in the future
  if (subscription.endDate) {
    return new Date(subscription.endDate) > new Date();
  }

  return true;
}

/**
 * Get or create a user's subscription (defaults to FREE)
 */
export async function getUserSubscription(userId: string) {
  console.log(`[Subscription] Fetching subscription for user: ${userId}`);

  let subscription = await prismaClient.subscription.findUnique({
    where: { userId },
  });

  // Create FREE subscription if none exists (for existing users)
  if (!subscription) {
    console.log(`[Subscription] Creating default FREE subscription for user: ${userId}`);
    subscription = await prismaClient.subscription.create({
      data: {
        userId,
        plan: "FREE",
        status: "ACTIVE",
      },
    });
  }

  return subscription;
}

/**
 * Check if a user can add a stream based on their subscription limits
 */
export async function checkCanAddStream(
  userId: string,
  creatorId: string
): Promise<{
  canAdd: boolean;
  reason?: string;
  currentCount?: number;
  limit?: number;
  plan?: SubscriptionPlan;
}> {
  console.log(`[Subscription] Checking if user ${userId} can add stream to creator ${creatorId}`);

  try {
    // Get the creator's subscription
    const subscription = await getUserSubscription(creatorId);
    const limits = getSubscriptionLimits(subscription.plan as SubscriptionPlan);

    // Check if subscription is active
    if (!isSubscriptionActive(subscription)) {
      console.log(`[Subscription] Subscription is not active for creator: ${creatorId}`);
      return {
        canAdd: false,
        reason: "Creator's subscription has expired. Please ask them to renew.",
        plan: subscription.plan as SubscriptionPlan,
      };
    }

    // Count current active streams for the creator
    const currentStreamCount = await prismaClient.stream.count({
      where: {
        userId: creatorId,
        played: false,
      },
    });

    console.log(`[Subscription] Current streams: ${currentStreamCount}, Limit: ${limits.maxSongs}`);

    // Check if adding another stream would exceed the limit
    if (currentStreamCount >= limits.maxSongs) {
      return {
        canAdd: false,
        reason: `Queue limit reached. Upgrade to add more songs. (${currentStreamCount}/${limits.maxSongs})`,
        currentCount: currentStreamCount,
        limit: limits.maxSongs,
        plan: subscription.plan as SubscriptionPlan,
      };
    }

    return {
      canAdd: true,
      currentCount: currentStreamCount,
      limit: limits.maxSongs,
      plan: subscription.plan as SubscriptionPlan,
    };
  } catch (error) {
    console.error(`[Subscription] Error checking stream limits:`, error);
    return {
      canAdd: false,
      reason: "Error checking subscription limits. Please try again.",
    };
  }
}

/**
 * Check if a user can join a room based on member limits
 */
export async function checkCanJoinRoom(
  creatorId: string
): Promise<{
  canJoin: boolean;
  reason?: string;
  currentCount?: number;
  limit?: number;
  plan?: SubscriptionPlan;
}> {
  console.log(`[Subscription] Checking if room ${creatorId} can accept new members`);

  try {
    // Get the creator's subscription
    const subscription = await getUserSubscription(creatorId);
    const limits = getSubscriptionLimits(subscription.plan as SubscriptionPlan);

    // Check if subscription is active
    if (!isSubscriptionActive(subscription)) {
      return {
        canJoin: false,
        reason: "This room's subscription has expired.",
        plan: subscription.plan as SubscriptionPlan,
      };
    }

    // TODO: Implement member counting when you add a "room members" feature
    // For now, we'll just return true with the limits
    const currentMemberCount = 0; // Placeholder

    console.log(`[Subscription] Current members: ${currentMemberCount}, Limit: ${limits.maxMembers}`);

    if (currentMemberCount >= limits.maxMembers) {
      return {
        canJoin: false,
        reason: `Room is full. Upgrade to allow more members. (${currentMemberCount}/${limits.maxMembers})`,
        currentCount: currentMemberCount,
        limit: limits.maxMembers,
        plan: subscription.plan as SubscriptionPlan,
      };
    }

    return {
      canJoin: true,
      currentCount: currentMemberCount,
      limit: limits.maxMembers,
      plan: subscription.plan as SubscriptionPlan,
    };
  } catch (error) {
    console.error(`[Subscription] Error checking room limits:`, error);
    return {
      canJoin: false,
      reason: "Error checking room capacity. Please try again.",
    };
  }
}

/**
 * Upgrade or change a user's subscription plan
 */
export async function updateSubscriptionPlan(
  userId: string,
  newPlan: SubscriptionPlan
): Promise<{
  success: boolean;
  subscription?: any;
  error?: string;
}> {
  console.log(`[Subscription] Updating subscription for user ${userId} to ${newPlan}`);

  try {
    const subscription = await getUserSubscription(userId);

    // Calculate end date (30 days from now for paid plans)
    const endDate =
      newPlan === "FREE"
        ? null
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const updatedSubscription = await prismaClient.subscription.update({
      where: { userId },
      data: {
        plan: newPlan,
        status: "ACTIVE",
        endDate,
      },
    });

    console.log(`[Subscription] Successfully updated subscription to ${newPlan}`);

    return {
      success: true,
      subscription: updatedSubscription,
    };
  } catch (error) {
    console.error(`[Subscription] Error updating subscription:`, error);
    return {
      success: false,
      error: "Failed to update subscription. Please try again.",
    };
  }
}

/**
 * Cancel a user's subscription (sets status to CANCELLED, keeps until end date)
 */
export async function cancelSubscription(userId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  console.log(`[Subscription] Cancelling subscription for user ${userId}`);

  try {
    await prismaClient.subscription.update({
      where: { userId },
      data: {
        status: "CANCELLED",
      },
    });

    console.log(`[Subscription] Successfully cancelled subscription`);

    return { success: true };
  } catch (error) {
    console.error(`[Subscription] Error cancelling subscription:`, error);
    return {
      success: false,
      error: "Failed to cancel subscription. Please try again.",
    };
  }
}

/**
 * Get all available subscription plans with details
 */
export function getAllPlans() {
  return Object.entries(SUBSCRIPTION_LIMITS).map(([key, value]) => ({
    id: key,
    plan: key as SubscriptionPlan,
    ...value,
  }));
}

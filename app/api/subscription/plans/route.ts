import { NextResponse } from "next/server";
import { getAllPlans } from "@/app/lib/subscription";

/**
 * GET /api/subscription/plans
 * Return available subscription plans with pricing
 */
export async function GET() {
  try {
    const plans = getAllPlans();

    return NextResponse.json({
      plans: plans.map((plan) => ({
        id: plan.id,
        name: plan.name,
        price: plan.price,
        maxMembers: plan.maxMembers === Infinity ? "Unlimited" : plan.maxMembers,
        maxSongs: plan.maxSongs === Infinity ? "Unlimited" : plan.maxSongs,
        features: plan.features,
      })),
    });
  } catch (error: any) {
    console.error("Error fetching subscription plans:", error);
    return NextResponse.json(
      { message: "Error fetching subscription plans", error: error.message },
      { status: 500 }
    );
  }
}

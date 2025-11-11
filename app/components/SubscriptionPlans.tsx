"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Crown, Star, Check, Loader2, Zap } from "lucide-react";
import axios from "axios";

interface Plan {
  id: string;
  name: string;
  price: number;
  maxMembers: string | number;
  maxSongs: string | number;
  features: string[];
}

interface SubscriptionPlansProps {
  currentPlan?: string;
  onUpgradeSuccess?: () => void;
}

export default function SubscriptionPlans({
  currentPlan = "FREE",
  onUpgradeSuccess,
}: SubscriptionPlansProps) {
  const [plans, setPlans] = useState<Plan[]>([
    {
      id: "FREE",
      name: "Free",
      price: 0,
      maxMembers: 5,
      maxSongs: 5,
      features: [
        "Up to 5 members per room",
        "Up to 5 songs in queue",
        "Basic voting features",
        "YouTube integration",
      ],
    },
    {
      id: "BASIC",
      name: "Basic",
      price: 9.99,
      maxMembers: 20,
      maxSongs: 20,
      features: [
        "Up to 20 members per room",
        "Up to 20 songs in queue",
        "Priority support",
        "Advanced voting features",
        "YouTube integration",
        "Remove ads",
      ],
    },
    {
      id: "PREMIUM",
      name: "Premium",
      price: 19.99,
      maxMembers: "Unlimited",
      maxSongs: "Unlimited",
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
  ]);

  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async (planId: string) => {
    setUpgradingPlan(planId);
    setError(null);

    try {
      // Call API to upgrade subscription
      const response = await axios.post("/api/subscription", {
        plan: planId,
      });

      console.log("Upgrade successful:", response.data);

      // Show success message
      alert(`Successfully upgraded to ${planId} plan!`);

      // Call success callback
      if (onUpgradeSuccess) {
        onUpgradeSuccess();
      }

      // Reload page to update UI
      window.location.reload();
    } catch (error: any) {
      console.error("Upgrade failed:", error);
      setError(
        error.response?.data?.message || "Failed to upgrade. Please try again."
      );
    } finally {
      setUpgradingPlan(null);
    }
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case "FREE":
        return <Star className="h-8 w-8" />;
      case "BASIC":
        return <Zap className="h-8 w-8" />;
      case "PREMIUM":
        return <Crown className="h-8 w-8" />;
      default:
        return <Star className="h-8 w-8" />;
    }
  };

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case "FREE":
        return "text-gray-600 border-gray-300";
      case "BASIC":
        return "text-blue-600 border-blue-400";
      case "PREMIUM":
        return "text-purple-600 border-purple-400";
      default:
        return "text-gray-600 border-gray-300";
    }
  };

  const getPlanBgColor = (planId: string) => {
    switch (planId) {
      case "FREE":
        return "bg-gray-50";
      case "BASIC":
        return "bg-blue-50";
      case "PREMIUM":
        return "bg-gradient-to-br from-purple-50 to-pink-50";
      default:
        return "bg-gray-50";
    }
  };

  const getPlanButtonColor = (planId: string) => {
    switch (planId) {
      case "FREE":
        return "bg-gray-500 hover:bg-gray-600";
      case "BASIC":
        return "bg-blue-600 hover:bg-blue-700";
      case "PREMIUM":
        return "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  };

  const isCurrentPlan = (planId: string) => planId === currentPlan;
  const isDowngrade = (planId: string) => {
    const planOrder = ["FREE", "BASIC", "PREMIUM"];
    return (
      planOrder.indexOf(planId) < planOrder.indexOf(currentPlan.toUpperCase())
    );
  };

  return (
    <div className="w-full">
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative rounded-xl border-2 ${getPlanColor(
              plan.id
            )} ${getPlanBgColor(
              plan.id
            )} p-6 shadow-lg transition-all duration-300 hover:scale-105 ${
              plan.id === "PREMIUM" ? "md:scale-105" : ""
            }`}
          >
            {/* Current Plan Badge */}
            {isCurrentPlan(plan.id) && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-md">
                  Current Plan
                </span>
              </div>
            )}

            {/* Recommended Badge for Premium */}
            {plan.id === "PREMIUM" && !isCurrentPlan(plan.id) && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-md">
                  ⭐ Recommended
                </span>
              </div>
            )}

            {/* Plan Icon */}
            <div className={`mb-4 ${getPlanColor(plan.id)}`}>
              {getPlanIcon(plan.id)}
            </div>

            {/* Plan Name */}
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {plan.name}
            </h3>

            {/* Plan Price */}
            <div className="mb-6">
              <span className="text-4xl font-extrabold text-gray-900">
                ${plan.price}
              </span>
              {plan.price > 0 && (
                <span className="text-gray-600 ml-2">/month</span>
              )}
            </div>

            {/* Plan Limits */}
            <div className="mb-6 space-y-2">
              <div className="flex items-center text-sm text-gray-700">
                <Check className="h-4 w-4 mr-2 text-green-600" />
                <span>
                  <strong>{plan.maxMembers}</strong> members
                </span>
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <Check className="h-4 w-4 mr-2 text-green-600" />
                <span>
                  <strong>{plan.maxSongs}</strong> songs in queue
                </span>
              </div>
            </div>

            {/* Plan Features */}
            <ul className="space-y-3 mb-6">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start text-sm">
                  <Check className="h-4 w-4 mr-2 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            {/* Action Button */}
            <Button
              onClick={() => handleUpgrade(plan.id)}
              disabled={
                isCurrentPlan(plan.id) ||
                upgradingPlan !== null ||
                isDowngrade(plan.id)
              }
              className={`w-full ${getPlanButtonColor(
                plan.id
              )} text-white font-semibold py-3 rounded-lg shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {upgradingPlan === plan.id ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : isCurrentPlan(plan.id) ? (
                "Current Plan"
              ) : isDowngrade(plan.id) ? (
                "Downgrade (Contact Support)"
              ) : plan.id === "FREE" ? (
                "Downgrade to Free"
              ) : (
                `Upgrade to ${plan.name}`
              )}
            </Button>
          </div>
        ))}
      </div>

      {/* Additional Info */}
      <div className="mt-8 text-center text-gray-600 text-sm">
        <p>
          💳 All plans include a 30-day money-back guarantee.{" "}
          <span className="font-semibold">No credit card required for Free plan.</span>
        </p>
        <p className="mt-2">
          📧 Need help choosing? Contact us at{" "}
          <a
            href="mailto:support@upyourtune.com"
            className="text-purple-600 hover:underline"
          >
            support@upyourtune.com
          </a>
        </p>
      </div>
    </div>
  );
}

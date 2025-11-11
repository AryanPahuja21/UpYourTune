"use client";

import { Button } from "@/components/ui/button";
import { AlertCircle, Crown, TrendingUp, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface SubscriptionBannerProps {
  currentUsage: number;
  limit: number;
  plan: string;
  type?: "songs" | "members";
  onDismiss?: () => void;
}

export default function SubscriptionBanner({
  currentUsage,
  limit,
  plan,
  type = "songs",
  onDismiss,
}: SubscriptionBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  // Don't show banner for unlimited plans
  if (limit === -1 || limit === Infinity) {
    return null;
  }

  // Calculate percentage
  const percentage = (currentUsage / limit) * 100;
  const isAtLimit = currentUsage >= limit;
  const isNearLimit = percentage >= 80 && !isAtLimit;

  // Don't show banner if not near limit and not at limit
  if (!isAtLimit && !isNearLimit) {
    return null;
  }

  // Don't show if dismissed
  if (dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
  };

  const getUpgradeMessage = () => {
    if (plan === "FREE") {
      return "Upgrade to BASIC for 20 songs or PREMIUM for unlimited!";
    } else if (plan === "BASIC") {
      return "Upgrade to PREMIUM for unlimited songs!";
    }
    return "You've reached your limit.";
  };

  const getBannerStyle = () => {
    if (isAtLimit) {
      return "bg-red-50 border-red-200";
    }
    return "bg-yellow-50 border-yellow-200";
  };

  const getIconColor = () => {
    if (isAtLimit) {
      return "text-red-600";
    }
    return "text-yellow-600";
  };

  const getProgressBarColor = () => {
    if (isAtLimit) {
      return "bg-red-500";
    } else if (isNearLimit) {
      return "bg-yellow-500";
    }
    return "bg-green-500";
  };

  return (
    <div
      className={`relative ${getBannerStyle()} border-2 rounded-lg p-4 shadow-md mb-4 animate-pulse`}
    >
      {/* Close Button */}
      {!isAtLimit && (
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      <div className="flex items-start space-x-4">
        {/* Icon */}
        <div className={`${getIconColor()} flex-shrink-0 mt-1`}>
          {isAtLimit ? (
            <AlertCircle className="h-6 w-6" />
          ) : (
            <TrendingUp className="h-6 w-6" />
          )}
        </div>

        {/* Content */}
        <div className="flex-grow">
          {/* Title */}
          <h3 className="font-semibold text-gray-900 mb-1">
            {isAtLimit
              ? `${type === "songs" ? "Queue" : "Room"} Limit Reached!`
              : `Approaching ${type === "songs" ? "Queue" : "Room"} Limit`}
          </h3>

          {/* Usage Display */}
          <div className="mb-2">
            <div className="flex items-center justify-between text-sm text-gray-700 mb-1">
              <span>
                Current: <strong>{currentUsage}</strong> / {limit}{" "}
                {type === "songs" ? "songs" : "members"}
              </span>
              <span className="font-semibold">{Math.round(percentage)}%</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={`${getProgressBarColor()} h-full transition-all duration-500 ease-out`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
          </div>

          {/* Message */}
          <p className="text-sm text-gray-700 mb-3">
            {isAtLimit
              ? `You can't add more ${
                  type === "songs" ? "songs" : "members"
                } with your ${plan} plan. ${getUpgradeMessage()}`
              : `You're using ${currentUsage} out of ${limit} ${
                  type === "songs" ? "songs" : "members"
                }. Consider upgrading for more capacity.`}
          </p>

          {/* Upgrade Button */}
          {plan !== "PREMIUM" && (
            <Link href="/subscription">
              <Button
                size="sm"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-md"
              >
                <Crown className="mr-2 h-4 w-4" />
                {isAtLimit ? "Upgrade Now" : "View Plans"}
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Upgrade Info Cards */}
      {isAtLimit && plan === "FREE" && (
        <div className="mt-4 pt-4 border-t border-gray-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="flex items-center space-x-2 mb-1">
                <div className="bg-blue-100 p-1 rounded">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </div>
                <span className="font-semibold text-sm">BASIC Plan</span>
              </div>
              <p className="text-xs text-gray-600">
                20 {type === "songs" ? "songs" : "members"} · $9.99/month
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-3 shadow-sm border border-purple-200">
              <div className="flex items-center space-x-2 mb-1">
                <div className="bg-purple-100 p-1 rounded">
                  <Crown className="h-4 w-4 text-purple-600" />
                </div>
                <span className="font-semibold text-sm">PREMIUM Plan</span>
              </div>
              <p className="text-xs text-gray-600">
                Unlimited {type === "songs" ? "songs" : "members"} ·
                $19.99/month
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

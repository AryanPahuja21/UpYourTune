"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Crown,
  ArrowLeft,
  Calendar,
  CheckCircle,
  XCircle,
  Loader2,
  Music,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import SubscriptionPlans from "../components/SubscriptionPlans";

interface SubscriptionData {
  subscription: {
    id: string;
    plan: string;
    status: string;
    startDate: string;
    endDate?: string;
    active: boolean;
  };
  limits: {
    maxMembers: number;
    maxSongs: number;
    name: string;
  };
  usage: {
    currentSongs: number;
    currentMembers: number;
  };
}

export default function SubscriptionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [subscriptionData, setSubscriptionData] =
    useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchSubscriptionData();
    }
  }, [status]);

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/subscription");
      setSubscriptionData(response.data);
    } catch (error: any) {
      console.error("Failed to fetch subscription:", error);
      setError(
        error.response?.data?.message || "Failed to load subscription data"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getDaysRemaining = (endDate?: string) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading subscription details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchSubscriptionData}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white border-b border-purple-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <Crown className="h-6 w-6 text-purple-600" />
              <span className="text-xl font-semibold text-purple-800">
                Subscription Management
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
        {/* Current Subscription Status */}
        {subscriptionData && (
          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-100">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Current Subscription
                </h2>
                <p className="text-gray-600">
                  Manage your subscription and view usage
                </p>
              </div>
              <div
                className={`flex items-center space-x-2 px-4 py-2 rounded-full ${
                  subscriptionData.subscription.active
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {subscriptionData.subscription.active ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <XCircle className="h-5 w-5" />
                )}
                <span className="font-semibold">
                  {subscriptionData.subscription.active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Plan Card */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border-2 border-purple-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Crown className="h-5 w-5 text-purple-600" />
                  <span className="text-sm font-semibold text-gray-600">
                    Current Plan
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {subscriptionData.subscription.plan}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {subscriptionData.limits.name}
                </p>
              </div>

              {/* Usage Card - Songs */}
              <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Music className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-semibold text-gray-600">
                    Queue Usage
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {subscriptionData.usage.currentSongs} /{" "}
                  {subscriptionData.limits.maxSongs === -1
                    ? "∞"
                    : subscriptionData.limits.maxSongs}
                </p>
                <p className="text-sm text-gray-600 mt-1">Songs in queue</p>
              </div>

              {/* Usage Card - Members */}
              <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-semibold text-gray-600">
                    Room Capacity
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {subscriptionData.usage.currentMembers} /{" "}
                  {subscriptionData.limits.maxMembers === -1
                    ? "∞"
                    : subscriptionData.limits.maxMembers}
                </p>
                <p className="text-sm text-gray-600 mt-1">Active members</p>
              </div>
            </div>

            {/* Subscription Dates */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Start Date</p>
                    <p className="font-semibold text-gray-900">
                      {formatDate(subscriptionData.subscription.startDate)}
                    </p>
                  </div>
                </div>

                {subscriptionData.subscription.endDate && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Renewal Date</p>
                      <p className="font-semibold text-gray-900">
                        {formatDate(subscriptionData.subscription.endDate)}
                      </p>
                      {getDaysRemaining(
                        subscriptionData.subscription.endDate
                      ) !== null && (
                        <p className="text-xs text-purple-600">
                          {getDaysRemaining(
                            subscriptionData.subscription.endDate
                          )}{" "}
                          days remaining
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Available Plans */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Available Plans
          </h2>
          <p className="text-gray-600 mb-6">
            Choose the plan that fits your needs
          </p>

          <SubscriptionPlans
            currentPlan={subscriptionData?.subscription.plan}
            onUpgradeSuccess={fetchSubscriptionData}
          />
        </div>

        {/* Billing History Section (Placeholder) */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Billing History
          </h2>
          <p className="text-gray-600 mb-6">
            View your past transactions and invoices
          </p>

          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">
              No billing history available yet
            </p>
            <p className="text-sm text-gray-500">
              Your invoices will appear here once you make a payment
            </p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">
                Can I cancel my subscription anytime?
              </h3>
              <p className="text-gray-600 text-sm">
                Yes! You can cancel your subscription at any time. You'll
                continue to have access until the end of your billing period.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-1">
                What happens if I exceed my limits?
              </h3>
              <p className="text-gray-600 text-sm">
                You won't be able to add more songs or members once you reach
                your plan's limit. Upgrade to a higher tier for more capacity.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-1">
                Do you offer refunds?
              </h3>
              <p className="text-gray-600 text-sm">
                Yes, we offer a 30-day money-back guarantee for all paid plans.
                Contact support if you're not satisfied.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

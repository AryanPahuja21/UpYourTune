"use client";
import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Crown, Music, LogIn, LogOut, User, Sparkles } from "lucide-react";
import Link from "next/link";
import axios from "axios";

const Navbar = () => {
  const session = useSession();
  const [subscriptionPlan, setSubscriptionPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session.status === "authenticated") {
      fetchSubscriptionData();
    } else {
      setLoading(false);
    }
  }, [session.status]);

  const fetchSubscriptionData = async () => {
    try {
      const response = await axios.get("/api/subscription");
      setSubscriptionPlan(response.data.subscription.plan);
    } catch (error) {
      console.error("Failed to fetch subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  const isPremium = subscriptionPlan === "PREMIUM";
  const isBasic = subscriptionPlan === "BASIC";
  const isFree = subscriptionPlan === "FREE";

  return (
    <nav className="bg-white border-b border-purple-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Music className="h-8 w-8 text-purple-600" />
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              UpYourTune
            </span>
          </Link>

          {/* Navigation Items */}
          <div className="flex items-center space-x-4">
            {session.data?.user ? (
              <>
                {/* User Info */}
                <div className="hidden sm:flex items-center space-x-2 bg-gray-100 px-3 py-1.5 rounded-full">
                  <User className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {session.data.user.email?.split("@")[0]}
                  </span>
                </div>

                {/* Premium Badge */}
                {!loading && isPremium && (
                  <div className="hidden sm:flex items-center space-x-1 bg-gradient-to-r from-purple-100 to-pink-100 px-3 py-1.5 rounded-full border-2 border-purple-300 shadow-sm">
                    <Crown className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-bold text-purple-700">
                      PREMIUM
                    </span>
                  </div>
                )}

                {/* Basic Badge */}
                {!loading && isBasic && (
                  <div className="hidden sm:flex items-center space-x-1 bg-blue-100 px-3 py-1.5 rounded-full border-2 border-blue-300 shadow-sm">
                    <Sparkles className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-bold text-blue-700">
                      BASIC
                    </span>
                  </div>
                )}

                {/* Upgrade Button (only for Free and Basic users) */}
                {!loading && !isPremium && (
                  <Link href="/subscription">
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-md font-semibold transition-all duration-300 hover:scale-105"
                    >
                      <Crown className="mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">
                        {isFree ? "Upgrade to Premium" : "Upgrade"}
                      </span>
                      <span className="sm:hidden">Upgrade</span>
                    </Button>
                  </Link>
                )}

                {/* Subscription Link (for Premium users) */}
                {!loading && isPremium && (
                  <Link href="/subscription">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-purple-600 border-purple-300 hover:bg-purple-50"
                    >
                      <Crown className="mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">Subscription</span>
                    </Button>
                  </Link>
                )}

                {/* Dashboard Link */}
                <Link href="/dashboard">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-purple-600 border-purple-300 hover:bg-purple-50"
                  >
                    <Music className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </Button>
                </Link>

                {/* Logout Button */}
                <Button
                  onClick={() => signOut()}
                  variant="outline"
                  size="sm"
                  className="text-pink-600 border-pink-300 hover:bg-pink-50"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </>
            ) : (
              <>
                {/* Login Button */}
                <Button
                  onClick={() => signIn()}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-md"
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Login
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Premium Benefits Banner (only for Free users) */}
      {!loading && session.data?.user && isFree && (
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm">
                <Crown className="h-4 w-4" />
                <span className="hidden sm:inline">
                  Unlock unlimited songs & members with Premium!
                </span>
                <span className="sm:hidden">Upgrade to Premium!</span>
              </div>
              <Link href="/subscription">
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-white text-purple-600 hover:bg-gray-100 border-0 text-xs font-semibold"
                >
                  Learn More →
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

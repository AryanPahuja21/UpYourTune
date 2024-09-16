"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Music, Headphones, Mic2, Radio } from "lucide-react";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-purple-100 to-pink-100">
      <header className="px-4 lg:px-6 h-14 flex items-center bg-white/50 backdrop-blur-md">
        <Link className="flex items-center justify-center" href="#">
          <Music className="h-6 w-6 text-purple-600" />
          <span className="ml-2 text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
            UpYourTune
          </span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <button
            className="text-sm font-medium hover:text-purple-600 transition-colors"
            onClick={() => signIn()}
          >
            Sign In
          </button>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 text-white">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none animate-pulse">
                  Vibe, Vote, Victorious!
                </h1>
                <p className="mx-auto max-w-[700px] md:text-xl">
                  UpYourTune: Where your votes drop the beat. The crowd's
                  favorite track plays next!
                </p>
              </div>
              <div className="space-x-4">
                <Button
                  className="bg-white text-purple-600 hover:bg-purple-100 transition-colors"
                  onClick={() => signIn()}
                >
                  Get Grooving
                </Button>
                <Button
                  variant="outline"
                  className="text-neutral-600 border-white hover:bg-white/20 transition-colors"
                >
                  Discover More
                </Button>
              </div>
            </div>
          </div>
        </section>
        <div className="w-full h-12 bg-gradient-to-r from-purple-600 via-pink-500 to-red-500">
          <svg
            className="w-full h-full"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
          >
            <path
              d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
              fill="#fff"
            ></path>
          </svg>
        </div>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-white">
          <div className="container px-4 md:px-6 mx-auto">
            <h2 className="py-1 text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
              How We Amplify Your Experience
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center p-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg shadow-lg transition-transform hover:scale-105">
                <Headphones className="h-12 w-12 text-purple-600 mb-4" />
                <h3 className="text-xl font-bold mb-2 text-purple-800">
                  Vote Your Vibe
                </h3>
                <p className="text-gray-600">
                  Drop your vote for the tracks that match your mood. Your
                  choice, your voice!
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-4 bg-gradient-to-br from-pink-100 to-red-100 rounded-lg shadow-lg transition-transform hover:scale-105">
                <Mic2 className="h-12 w-12 text-pink-600 mb-4" />
                <h3 className="text-xl font-bold mb-2 text-pink-800">
                  Top Track Takeover
                </h3>
                <p className="text-gray-600">
                  The people's choice hits the speakers next. Democracy in
                  action!
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-4 bg-gradient-to-br from-red-100 to-orange-100 rounded-lg shadow-lg transition-transform hover:scale-105">
                <Radio className="h-12 w-12 text-red-600 mb-4" />
                <h3 className="text-xl font-bold mb-2 text-red-800">
                  Live Vibes
                </h3>
                <p className="text-gray-600">
                  Watch votes roll in real-time. Feel the pulse of the crowd!
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-br from-purple-600 to-pink-600 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0 bg-repeat"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
              }}
            ></div>
          </div>
          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Ready to UpYourTune?
                </h2>
                <p className="mx-auto max-w-[600px] md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Join the rhythm revolution! Your favorite beats are just a
                  vote away from center stage.
                </p>
              </div>
              <div className="w-full max-w-sm space-y-2">
                <form className="flex space-x-2">
                  <Input
                    className="max-w-lg flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/80"
                    placeholder="Drop your email"
                    type="email"
                  />
                  <Button
                    type="submit"
                    className="bg-white text-purple-600 hover:bg-purple-100 transition-colors"
                  >
                    Let's Rock
                  </Button>
                </form>
                <p className="text-xs text-white/80">
                  By signing up, you're tuning into our{" "}
                  <Link
                    className="underline underline-offset-2 hover:text-white transition-colors"
                    href="#"
                  >
                    Groove Guidelines
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t bg-white/50 backdrop-blur-md">
        <p className="text-xs text-gray-700">
          © 2023 UpYourTune. All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link
            className="text-xs hover:underline underline-offset-4 text-gray-700 hover:text-purple-600 transition-colors"
            href="#"
          >
            Terms of Service
          </Link>
          <Link
            className="text-xs hover:underline underline-offset-4 text-gray-700 hover:text-purple-600 transition-colors"
            href="#"
          >
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}

"use client";

import { useSession } from "next-auth/react";
import LandingPage from "./components/LandingPage";
import StreamingPage from "./components/StreamingPage";

export default function Home() {
  const session = useSession();

  return <>{session?.data?.user ? <StreamingPage /> : <LandingPage />}</>;
}

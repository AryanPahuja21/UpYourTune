"use client";

import { useSession } from "next-auth/react";
import LandingPage from "./components/LandingPage";
import { redirect } from "next/navigation";

export default function Home() {
  const session = useSession();

  return <>{session?.data?.user ? redirect("/dashboard") : <LandingPage />}</>;
}

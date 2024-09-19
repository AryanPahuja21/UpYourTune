"use client";
import { useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import StreamingPage from "@/app/components/StreamingPage";

const UserView = ({
  params: { creatorId },
}: {
  params: {
    creatorId: string;
  };
}) => {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      signIn();
    }
  }, [status]);

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  return (
    <>
      {session?.user ? (
        <StreamingPage creatorId={creatorId} playVideo={false} />
      ) : (
        <p>Redirecting to sign-in...</p>
      )}
    </>
  );
};

export default UserView;

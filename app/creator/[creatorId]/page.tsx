"use client";
import StreamingPage from "@/app/components/StreamingPage";
import { signIn, useSession } from "next-auth/react";

const UserView = ({
  params: { creatorId },
}: {
  params: {
    creatorId: string;
  };
}) => {
  const session = useSession();
  return (
    <>
      {session?.data?.user ? (
        <StreamingPage creatorId={creatorId} />
      ) : (
        <>{signIn()}</>
      )}
    </>
  );
};

export default UserView;

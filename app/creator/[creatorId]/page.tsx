import StreamingPage from "@/app/components/StreamingPage";
import React from "react";

const UserView = ({
  params: { creatorId },
}: {
  params: {
    creatorId: string;
  };
}) => {
  return <StreamingPage creatorId={creatorId} />;
};

export default UserView;

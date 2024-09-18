import React from "react";

const UserView = ({
  params: { creatorId },
}: {
  params: {
    creatorId: string;
  };
}) => {
  return <div>{creatorId}</div>;
};

export default UserView;

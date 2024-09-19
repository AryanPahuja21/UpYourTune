"use client";
import { useEffect, useState } from "react";
import StreamingPage from "../components/StreamingPage";
import axios from "axios";

const Dashboard = () => {
  const [creatorId, setCreatorId] = useState<string>("");

  const fetchUser = async () => {
    const response = await axios.get("/api/getUser");
    setCreatorId(response.data.user);
  };
  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <div>
      {creatorId && <StreamingPage creatorId={creatorId} playVideo={true} />}
    </div>
  );
};

export default Dashboard;

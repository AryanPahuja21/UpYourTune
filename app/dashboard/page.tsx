import StreamingPage from "../components/StreamingPage";

const Dashboard = () => {
  const creatorId = "1";
  return (
    <div>
      <StreamingPage creatorId={creatorId} />
    </div>
  );
};

export default Dashboard;

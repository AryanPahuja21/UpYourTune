import StreamingPage from "../components/StreamingPage";

const Dashboard = () => {
  const creatorId = "cm14182270000rzvfhli8asjz";
  return (
    <div>
      <StreamingPage creatorId={creatorId} playVideo={true} />
    </div>
  );
};

export default Dashboard;

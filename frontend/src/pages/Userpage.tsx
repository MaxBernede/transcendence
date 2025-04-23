import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "../styles/Userpage.css";
import LogoutButton from "../components/Logoutbutton";
import ProfileBanner from "../components/ProfileBanner";
import MatchList from "../components/MatchList";
import EventsHandler from "../events/EventsHandler";
import OnlineStatus from "../components/OnlineStatus";
import { UserData } from "../utils/UserLogic";
const UserPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [localUserData, setLocalUserData] = useState<UserData | null>(null);
  const [localMatchHistory, setLocalMatchHistory] = useState<any[]>([]);
  const [localLoading, setLocalLoading] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        // Fetch user data
        const resUser = await fetch(`/api/users/${id}`);
        if (!resUser.ok) throw new Error("User fetch failed");
        const user = await resUser.json();
        setLocalUserData(user);

        // Fetch match history
        const actualId = id === "me" ? user.id : id;
        const resMatches = await fetch(`/matches/${actualId}`);
        if (!resMatches.ok) throw new Error("Matches not found");
        const matchData = await resMatches.json();
        setLocalMatchHistory(matchData);
      } catch (err) {
        console.error("Error fetching user or matches:", err);
        setLocalError("Failed to fetch data");
      } finally {
        setLocalLoading(false);
      }
    };

    // Wait for socket before fetching data
    const handler = EventsHandler.getInstance();
    if (handler.isReady()) {
      fetchData();
    } else {
      const socket = handler.getSocket();
      socket?.once("connect", fetchData);
    }
  }, [id]);

  if (localLoading) return <p>Loading...</p>;
  if (localError) return <p>{localError}</p>;

  return (
    <div className="user-page-container">
      <ProfileBanner
        username={localUserData?.username ?? "Unknown"}
        avatar={localUserData?.avatar}
      />
      <div className="content-container">
        {id === "me" && <LogoutButton />}
        <OnlineStatus isOnline={localUserData?.activity_status === true} />
        <div className="stats flex justify-center w-full mb-2 text-xl font-semibold text-white-800">
          <div className="wins mx-8">
            <strong className="text-4xl font-extrabold text-green-600">
              Wins:
            </strong>
            <span className="text-3xl">{localUserData?.wins || 0}</span>
          </div>
          <div className="losses mx-8">
            <strong className="text-4xl font-extrabold text-red-600">
              Losses:
            </strong>
            <span className="text-3xl">{localUserData?.loose || 0}</span>
          </div>
        </div>
      </div>

      <div className="match-history mt-6 w-full">
        {/* <MatchList localUserData={localUserData.id.toString()} />
		<MatchList userId={userData.id.toString()} /> */}
        {/* <MatchList userId={localUserData.id.toString()} /> */}
        <MatchList localUserData={localUserData} />
      </div>
    </div>
  );
};

export default UserPage;

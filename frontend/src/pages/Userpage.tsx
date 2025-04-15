import React, { useContext, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/Userpage.css';
import { Header } from '../components/Header';
import { Stats } from '../components/Stats';
import { MatchHistory } from '../components/MatchHistory';
import LogoutButton from '../components/Logoutbutton';
import { handleImageChange } from '../utils/UserHandlers';
import { updateUserUsername } from '../utils/UserLogic';
import { UserContext } from '../App';
import ProfileBanner from '../components/ProfileBanner';
import MatchList from '../components/MatchList';
import { useLocation } from 'react-router-dom';
import EventsHandler from '../events/EventsHandler';
import OnlineStatus from '../components/OnlineStatus';

const UserPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { userData, setUserData, loading, error, matchHistory, setMatchHistory } = useContext(UserContext); // Use context
  useEffect(() => {
	if (!id) return;

	const fetchUserData = async () => {
		try {
			const res = await fetch(`/api/users/${id}`);
			const data = await res.json();
			console.log("DATA: ", data)
			setUserData(data);
		} catch (err) {
			console.error('Error fetching user:', err);
		}
	};

	const waitForSocket = () => {
		const handler = EventsHandler.getInstance();
		if (handler.isReady()) {
			fetchUserData();
		} else {
			const socket = handler.getSocket();
			socket?.once("connect", fetchUserData);
			// fallback timeout au cas où "connect" ne vient jamais
			setTimeout(fetchUserData, 2000);
		}
	};

	waitForSocket();
}, [id]);

  const location = useLocation();

  useEffect(() => {
	const fetchUserAndMatches = async () => {
	  try {
		// Step 1: always fetch the user
		const resUser = await fetch(`/api/users/${id}`);
		if (!resUser.ok) throw new Error('User not found');
		const user = await resUser.json();
		setUserData(user);
  
		// Step 2: get numeric ID if "me"
		const actualId = id === 'me' ? user.id : id;
  
		// Step 3: fetch matches using real ID
		const resMatches = await fetch(`/matches/${actualId}`);
		if (!resMatches.ok) throw new Error('Matches not found');
		const matchData = await resMatches.json();
		setMatchHistory(matchData);
	  } catch (err) {
		console.error('Error fetching user or matches:', err);
	  }
	};
  
	if (id) {
	  fetchUserAndMatches();
	}
  }, [id]);
  
  
  
// 	const fetchLatestMatches = async () => {
// 	  try {
// 		const res = await fetch(`/matches/${id}`);
// 		if (!res.ok) throw new Error('Matches not found');
// 		const data = await res.json();
// 		setMatchHistory(data);
// 	  } catch (err) {
// 		console.error('Error fetching updated matches:', err);
// 	  }
// 	};
  
// 	if (id) {
// 	  fetchLatestUserData();
// 	  fetchLatestMatches();
// 	}
  
//   }, [location.pathname]);

// useEffect(() => {
// 	const fetchLatestMatches = async () => {
// 	  try {
// 		const res = await fetch(`/matches/${id}`);
// 		if (!res.ok) throw new Error('Matches not found');
// 		const data = await res.json();
// 		setMatchHistory(data);
// 	  } catch (err) {
// 		console.error('Error fetching updated matches:', err);
// 	  }
// 	};
  
// 	if (id) {
// 	  fetchLatestUserData();  // Assuming this gets user info
// 	  fetchLatestMatches();
// 	}
//   }, [id]);
  
  

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;
  return (
    <div className="user-page-container">
      <ProfileBanner />
      <div className="content-container">
      { id == "me" && <LogoutButton /> }
	  <OnlineStatus isOnline={userData?.activity_status === true} />
        {/* Stats centered */}
        <div className="stats flex justify-center w-full mb-2 text-xl font-semibold text-white-800">
          <div className="wins mx-8">
            <strong className="text-4xl font-extrabold text-green-600">Wins:</strong> 
            <span className="text-3xl">{userData?.wins || 0}</span>
          </div>
          <div className="losses mx-8">
            <strong className="text-4xl font-extrabold text-red-600">Losses:</strong> 
            <span className="text-3xl">{userData?.loose || 0}</span>
          </div>
        </div>
      </div>
  
      {/* Match History below, full width */}
      <div className="match-history mt-6 w-full">
        <MatchList userId={id ? id : ""} />
      </div>
    </div>
  );
  
  
  
};

export default UserPage;

import React, { useContext, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/Userpage.css';
import { Header } from '../components/Header';
import { Stats } from '../components/Stats';
import { MatchHistory } from '../components/MatchHistory';
import LogoutButton from '../components/Logoutbutton';
import { handleImageChange } from '../utils/UserHandlers';
import { updateUserUsername } from '../utils/UserLogic';
import { UserContext } from '../App'; // Import UserContext
import ProfileBanner from '../components/ProfileBanner';
import MatchList from '../components/MatchList';

const UserPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { userData, setUserData, loading, error, matchHistory, setMatchHistory } = useContext(UserContext); // Use context
	useEffect(() => {
		if (!id) return;

		const fetchUserData = async () => {
			try {
				const res = await fetch(`/api/users/${id}`);
				const data = await res.json();
				setUserData(data);
			} catch (err) {
				console.error('Error fetching user:', err);
			}
		};

		fetchUserData();
	}, [id]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="user-page-container">
      <ProfileBanner />
      <div className="content-container">
      { id == "me" && <LogoutButton /> }

        {/* Stats centered */}
        <div className="stats flex justify-center w-full mb-2 text-xl font-semibold text-white-800">
          <div className="wins mx-8">
            <strong className="text-4xl font-extrabold text-green-600">Wins:</strong> 
            <span className="text-3xl">{userData?.wins || 0}</span>
          </div>
          <div className="losses mx-8">
            <strong className="text-4xl font-extrabold text-red-600">Losses:</strong> 
            <span className="text-3xl">{userData?.losses || 0}</span>
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

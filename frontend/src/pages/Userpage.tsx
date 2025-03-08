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

const UserPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { userData, setUserData, loading, error, matchHistory, setMatchHistory } = useContext(UserContext); // Use context

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="user-page-container">
      <ProfileBanner></ProfileBanner>
      <div className="content-container">
        <div className="user-info">
          <p>userId: {userData?.intraId}</p>
          {/* check if username is same as user to print button */}
          <LogoutButton /> 
        </div>
        <Stats
          wins={userData?.wins || 0}
          losses={userData?.losses || 0}
        />
        <MatchHistory matchHistory={matchHistory} />
      </div>
    </div>
  );
};

export default UserPage;

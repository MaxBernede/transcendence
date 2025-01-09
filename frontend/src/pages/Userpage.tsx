import React, { useContext, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/Userpage.css';
import { Header } from '../components/Header';
import { Stats } from '../components/Stats';
import { MatchHistory } from '../components/MatchHistory';
import LogoutButton from '../components/Logoutbutton';
import { handleImageChange } from '../utils/UserHandlers';
import { updateUserUsername, UserData, fetchUserData } from '../utils/UserLogic';
import { UserContext } from '../App'; // Import UserContext

const UserPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { userData, setUserData, loading, error, achievements, setAchievements, matchHistory, setMatchHistory } = useContext(UserContext); // Use context

  useEffect(() => {
    if (!userData) {
      // If userData is not available, fetch it
      fetchUserData(setUserData, setAchievements, setMatchHistory, () => {}, () => {});
    }
  }, [userData, setUserData, setAchievements, setMatchHistory]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="user-page-container">
      <Header
        id={userData?.id || ''}
        username={userData?.username || ''}
        avatar={userData?.avatar || ''}
        handleImageChange={(e) => handleImageChange(e, userData?.id || '', setUserData)}
        setUsername={(newUsername) =>
          updateUserUsername(newUsername, userData?.id || '', setUserData, () => {}, () => {})
        }
      />
      <div className="content-container">
        <div className="user-info">
          <h2>{userData?.username}</h2>
          <LogoutButton />
        </div>
        <Stats
          wins={userData?.wins || 0}
          losses={userData?.losses || 0}
          ladderLevel={userData?.ladderLevel || 0}
          achievements={achievements}
        />
        <MatchHistory matchHistory={matchHistory} />
      </div>
    </div>
  );
};

export default UserPage;

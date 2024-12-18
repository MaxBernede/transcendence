import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './Userpage.css';
import { Header } from '../components/Header';
import { Stats } from '../components/Stats';
import { MatchHistory } from '../components/MatchHistory';
import defaultAvatar from '../assets/Bat.jpg';

const UserPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
	const [avatar] = useState<string>(defaultAvatar);
  const [matchHistory, setMatchHistory] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<
    { id: number; achievementName: string; description: string }[]
  >([]);

  // States for editing user data
  const [newUsername, setNewUsername] = useState<string>('');
  const [editing, setEditing] = useState(false);

useEffect(() => {
	if (!id) {
	  setError('User ID is missing.');
	  setLoading(false);
	  return;
	}
  
	// Fetch user data with relations (achievements and match history included)
	axios
	  .get(`http://localhost:3000/api/users/${id}/with-relations`)
	  .then((response) => {
		console.log('User data with relations fetched:', response.data);
  
		const { achievements, matchHistory, ...userData } = response.data;
  
		setUserData({
		  ...userData,
		  avatar: userData.avatar || defaultAvatar,
		});
  
		setAchievements(
		  achievements.map((achievement: any) => ({
			id: achievement.id,
			achievementName: achievement.achievementName,
			description: achievement.description || 'No description available',
		  }))
		);
  
		setMatchHistory(matchHistory);
	  })
	  .catch((error) => {
		console.error('Error fetching user data with relations:', error);
		setError('User not found.');
	  })
	  .finally(() => setLoading(false));
  }, [id]);
  
  const handleUpdateUser = () => {
    if (!newUsername.trim()) {
      setError('Username cannot be empty.');
      return;
    }

    axios
      .put(`http://localhost:3000/api/users/${id}`, { username: newUsername })
      .then((response) => {
        console.log('User updated successfully:', response.data);
        setUserData((prevData: any) => ({ ...prevData, username: response.data.username }));
        setEditing(false); // Exit edit mode
      })
      .catch((error) => {
        console.error('Error updating user data:', error);
        setError('Failed to update user.');
      });
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="user-page-container">
      <Header
        id={id!}
        username={userData?.username || ''}
        avatar={`${avatar}?t=${new Date().getTime()}`}
        handleImageChange={(e) => console.log('Image change')}
        setUsername={(newUsername) => console.log('Set username:', newUsername)}
      />
      <div className="content-container">
        {editing ? (
          <div className="edit-user-container">
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="Enter new username"
            />
            <button onClick={handleUpdateUser}>Save</button>
            <button onClick={() => setEditing(false)}>Cancel</button>
          </div>
        ) : (
          <div className="user-info">
            <h2>{userData?.username}</h2>
            <button onClick={() => setEditing(true)}>Edit Username</button>
          </div>
        )}

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

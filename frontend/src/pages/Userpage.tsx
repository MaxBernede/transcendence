import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Userpage.css';
import { Header } from '../components/Header';
import { Stats } from '../components/Stats';
import { MatchHistory } from '../components/MatchHistory';
import defaultAvatar from '../assets/Bat.jpg';

const UserPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>(); // Dynamic routing, if needed
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matchHistory, setMatchHistory] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<
    { id: number; achievementName: string; description: string }[]
  >([]);
  const [newUsername, setNewUsername] = useState<string>('');
  const [editing, setEditing] = useState(false);

//   useEffect(() => {
//     const fetchUserData = async () => {
//       try {
//         // Fetch user data from /users/me using JWT stored in cookies
//         const response = await axios.get('http://localhost:3000/api/users/me', {
//           withCredentials: true, // Include cookies
//         });

//         const user = response.data;

//         setUserData({
//           ...user,
//           avatar: user.avatar || defaultAvatar,
//         });

//         setAchievements(
//           user.achievements?.map((achievement: any) => ({
//             id: achievement.id,
//             achievementName: achievement.achievementName,
//             description: achievement.description || 'No description available',
//           })) || []
//         );

//         setMatchHistory(user.matchHistory || []);
//       } catch (error) {
//         console.error('Failed to fetch user data:', error);
//         setError('Authentication required. Redirecting to login...');
//         setTimeout(() => navigate('/login'), 3000); // Redirect to login after 3 seconds
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchUserData();
//   }, [navigate]);

useEffect(() => {
	const fetchUserData = async () => {
	  try {
		const response = await axios.get('http://localhost:3000/api/users/me', {
		  withCredentials: true, // Include cookies
		});
  
		const user = response.data;
  
		setUserData({
		  ...user,
		  avatar: user.avatar || defaultAvatar,
		});
  
		setAchievements(
		  user.achievements?.map((achievement: any) => ({
			id: achievement.id,
			achievementName: achievement.achievementName,
			description: achievement.description || 'No description available',
		  })) || []
		);
  
		setMatchHistory(user.matchHistory || []);
	  } catch (error) {
		// Check if error is an AxiosError
		if (axios.isAxiosError(error)) {
		  console.error('Error fetching user data:', error.response?.data || error.message);
		} else {
		  console.error('Unexpected error:', error);
		}
  
		setUserData({ username: 'Guest', avatar: defaultAvatar }); // Default fallback
	  } finally {
		setLoading(false);
	  }
	};
  
	fetchUserData();
  }, [navigate]);
  
  

  const handleUpdateUser = async () => {
    if (!newUsername.trim()) {
      setError('Username cannot be empty.');
      return;
    }

    try {
      const response = await axios.put(
        `http://localhost:3000/api/users/${id || userData?.id}`,
        { username: newUsername },
        { withCredentials: true }
      );

      console.log('User updated successfully:', response.data);
      setUserData((prevData: any) => ({ ...prevData, username: response.data.username }));
      setEditing(false); // Exit edit mode
    } catch (error) {
      console.error('Error updating user data:', error);
      setError('Failed to update user.');
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="user-page-container">
      <Header
        id={userData?.id || ''}
        username={userData?.username || ''}
        avatar={`${userData?.avatar || defaultAvatar}?t=${new Date().getTime()}`}
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

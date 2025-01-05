import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Userpage.css';
import { Header } from '../components/Header';
import { Stats } from '../components/Stats';
import { MatchHistory } from '../components/MatchHistory';

const defaultAvatar = '/assets/Bat.jpg';

type UserData = {
  id: string;
  username: string;
  avatar: string | null;
  image?: { link?: string };
  [key: string]: any; // Optional if there are other dynamic fields
};

const buildAvatarUrl = (avatar: string | null, imageLink?: string | null): string => {
	// Prioritize `imageLink` if available
	const url = imageLink || avatar || defaultAvatar;
  
	// If it's an external URL, return it as is
	if (url.startsWith('http://') || url.startsWith('https://')) {
	  return url;
	}
  
	// If it already has a timestamp, return it
	if (url.includes('?t=')) {
	  return url;
	}
  
	// Add a timestamp for local URLs to prevent caching
	return `${url}${url.includes('?') ? '&' : '?'}t=${new Date().getTime()}`;
  };
  

const UserPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matchHistory, setMatchHistory] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<
    { id: number; achievementName: string; description: string }[]
  >([]);
  const [newUsername, setNewUsername] = useState<string>('');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
	const fetchUserData = async () => {
	  try {
		const response = await axios.get('http://localhost:3000/api/users/me', {
		  withCredentials: true,
		});
  
		const user = response.data;
  
		console.log('Fetched user data:', user);
  
		setUserData({
		  ...user,
		  avatar: buildAvatarUrl(user.avatar, user.image?.link),
		  losses: user.losses || user.loose || 0,
		  ladderLevel: user.ladderLevel || user.ladder_level || 0,
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
		if (axios.isAxiosError(error)) {
		  console.error('Error fetching user data:', error.response || error.message);
		  setError(error.response?.data?.message || 'Failed to fetch user data. Please log in.');
		} else {
		  console.error('An unexpected error occurred:', error);
		  setError('An unexpected error occurred. Please try again.');
		}
	  } finally {
		setLoading(false);
	  }
	};
  
	fetchUserData();
  }, []);
  

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
	const file = e.target.files?.[0];
	if (!file) return;
  
	try {
	  const formData = new FormData();
	  formData.append('file', file);
  
	  const response = await axios.post(
		`http://localhost:3000/api/users/${userData?.id}/upload-avatar`,
		formData,
		{ withCredentials: true }
	  );

	  setUserData((prev: UserData | null) => ({
		...prev!,
		avatar: buildAvatarUrl(response.data.avatar),
	  }));
	} catch (error) {
	  console.error('Error uploading avatar:', error);
	}
  };	  
  
  

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

      setUserData((prevData: UserData | null) => ({
        ...prevData!,
        username: response.data.username,
      }));
      setEditing(false);
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
	avatar={buildAvatarUrl(userData?.avatar ?? null, userData?.image?.link ?? null)}
	handleImageChange={handleImageChange}
	setUsername={(newUsername) =>
		setUserData((prev: UserData | null) => ({ ...prev!, username: newUsername }))
	}
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

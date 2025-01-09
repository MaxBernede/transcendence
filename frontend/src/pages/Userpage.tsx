import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Userpage.css';
import { Header } from '../components/Header';
import { Stats } from '../components/Stats';
import { MatchHistory } from '../components/MatchHistory';
import LogoutButton from '../components/Logoutbutton';
import { updateUser, updateUserAvatar, buildAvatarUrl } from '../utils/UserUtils';
import { handleImageChange } from '../utils/UserHandlers';

type UserData = {
  id: string;
  username: string;
  avatar: string | null;
  image?: { link?: string };
  [key: string]: any; // Optional if there are other dynamic fields
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

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="user-page-container">
		<Header
			id={userData?.id || ''}
			username={userData?.username || ''}
			avatar={buildAvatarUrl(userData?.avatar ?? null, userData?.image?.link ?? null)}
			handleImageChange={(e) =>
				handleImageChange(e, userData?.id || '', setUserData)
			}
			setUsername={(newUsername) =>
				setUserData((prev: UserData | null) => ({ ...prev!, username: newUsername }))
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

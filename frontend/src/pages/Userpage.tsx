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
  const [avatar, setAvatar] = useState<string | null>(null);
  const [matchHistory, setMatchHistory] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<{ id: number; achievementName: string; description: string }[]>([]);
  const avatarPath = avatar ? `${avatar}?t=${new Date().getTime()}` : defaultAvatar;

  useEffect(() => {
    if (id) {
      console.log('Fetching data for user ID:', id);

      // Fetch user data
      axios
        .get(`http://localhost:3000/api/users/${id}`)
        .then((response) => {
          console.log('User data fetched:', response.data);
          setUserData(response.data);
          setAvatar(
            response.data.avatar
              ? `http://localhost:3000/uploads/avatars/${response.data.avatar}`
              : defaultAvatar
          );
        })
        .catch((error) => {
          console.error('Error fetching user data:', error);
          setUserData(null);
        });

      // Fetch match history
      axios
        .get(`http://localhost:3000/matches/user/${id}`)
        .then((response) => {
          console.log('Match history fetched:', response.data);
          setMatchHistory(response.data);
        })
        .catch((error) => {
          console.error('Error fetching match history:', error);
          setMatchHistory([]);
        });

      // Fetch achievements
      axios
        .get(`http://localhost:3000/api/achievements`)
        .then((response) => {
          console.log('Achievements fetched:', response.data);
          const transformedAchievements = response.data.map((achievement: any) => ({
            id: achievement.id,
            achievementName: achievement.achievementName,
            description: achievement.description || 'No description available', // Add default description
          }));
          setAchievements(transformedAchievements);
        })
        .catch((error) => {
          console.error('Error fetching achievements:', error);
          setAchievements([]);
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) return <p>Loading...</p>;
  if (!userData) return <p>User not found.</p>;

  return (
    <div className="user-page-container">
      <Header
        id={id!}
        username={userData?.username || ''}
        avatar={avatarPath}
        handleImageChange={(e) => console.log('Image change')} 
        setUsername={(newUsername) => console.log('Set username:', newUsername)}
      />
      <div className="content-container">
        <Stats
          wins={userData?.wins || 0}
          losses={userData?.losses || 0}
          ladderLevel={userData?.ladder_level || 0}
          achievements={achievements} // Pass transformed achievements
        />
        <MatchHistory matchHistory={matchHistory} />
      </div>
    </div>
  );
};

export default UserPage;

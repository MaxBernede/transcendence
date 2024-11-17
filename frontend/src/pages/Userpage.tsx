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
  const avatarPath = avatar ? `${avatar}?t=${new Date().getTime()}` : defaultAvatar;

  useEffect(() => {
    if (id) {
      axios
        .get(`http://localhost:3000/api/users/${id}`)
        .then((response) => {
          setUserData(response.data);
          setAvatar(
            response.data.avatar
              ? `http://localhost:3000/uploads/avatars/${response.data.avatar}`
              : defaultAvatar
          );
        })
        .catch(() => setUserData(null));

      axios
        .get(`http://localhost:3000/api/users/${id}/match-history`)
        .then((response) => setMatchHistory(response.data))
        .catch(() => setMatchHistory([]))
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
  		achievements={userData?.achievements || []} // Default to an empty array
/>
        <MatchHistory matchHistory={matchHistory} />
      </div>
    </div>
  );
};

export default UserPage;

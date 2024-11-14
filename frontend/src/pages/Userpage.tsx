import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './Userpage.css';
import { Header } from '../components/Header'; // Import the Header component

import defaultAvatar from '../assets/Bat.jpg';

const UserPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [userData, setUserData] = useState<any>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFriend, setIsFriend] = useState(false);

  // Fetch user data from backend
  useEffect(() => {
    if (id) {
      axios
        .get(`http://localhost:3000/api/users/${id}`)
        .then((response) => {
          if (response.data) {
            setUserData(response.data);
            // If the avatar is available, set it. Otherwise, use the default avatar.
            setAvatar(
              response.data.avatar
                ? `http://localhost:3000/uploads/avatars/${response.data.avatar}`
                : defaultAvatar
            );
            // Determine if the user is already a friend based on friends list
            setIsFriend(response.data.friends?.some((friend: any) => friend.id === id));
          } else {
            setUserData(null);
          }
        })
        .catch((error) => {
          console.error('Error fetching user data:', error);
          setUserData(null);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id]);

  // Handle adding a friend
  const handleAddFriend = () => {
    if (id) {
      axios
        .post(`http://localhost:3000/api/users/${id}/add-friend`)
        .then((response) => {
          console.log('Friend added:', response.data);
          setIsFriend(true);
        })
        .catch((error) => {
          console.error('Error adding friend:', error);
        });
    }
  };

  // Handle avatar image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('file', file);

      axios
        .post(`http://localhost:3000/users/upload-avatar/${id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        .then((response) => {
          if (response.data.avatar) {
            setAvatar(`http://localhost:3000/uploads/avatars/${response.data.avatar}`);
          }
        })
        .catch((error) => {
          console.error('Error uploading avatar:', error);
        });
    }
  };

  const updateUsername = (newUsername: string) => {
    if (id) {
      axios
        .patch(
          `http://localhost:3000/api/users/${id}/update-username`,
          { username: newUsername.trim() },
          { headers: { 'Content-Type': 'application/json' } }
        )
        .then((response) => {
          console.log('Username updated successfully:', response.data);
          setUserData((prev: any) => ({
            ...prev,
            name: response.data.username, // Store the clean username
          }));
        })
        .catch((error) => {
          console.error('Error updating username:', error.response?.data || error);
          alert(error.response?.data?.error || 'Failed to update username.');
        });
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!userData) {
    return <p>User not found.</p>;
  }

  return (
    <div className="user-page-container">
      {/* Header Component with User Information */}
      <Header
        id={id!}
        username={userData.name} // Pass only the raw username
        avatar={avatar || defaultAvatar}
        handleImageChange={handleImageChange}
        setUsername={updateUsername}
      />

      {/* Add Friend Button */}
      {!isFriend && (
        <div className="add-friend-section">
          <button className="add-friend-button" onClick={handleAddFriend}>
            Add Friend
          </button>
        </div>
      )}
    </div>
  );
};

export default UserPage;

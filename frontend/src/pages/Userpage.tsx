import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './Userpage.css';
import { Header } from '../components/Header';
import defaultAvatar from '../assets/Bat.jpg';

const UserPage: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // Get user ID from the URL
  const [userData, setUserData] = useState<any>(null); // State for user data
  const [loading, setLoading] = useState(true); // State to handle loading
  const [avatar, setAvatar] = useState<string | null>(null); // State to store avatar URL
  const avatarPath = avatar ? `${avatar}?t=${new Date().getTime()}` : defaultAvatar;

  // Fetch user data on component load
  useEffect(() => {
	if (id) {
	  axios
		.get(`http://localhost:3000/api/users/${id}`)
		.then((response) => {
		  console.log('User data response:', response.data); // Check if username exists
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
		})
		.finally(() => setLoading(false));
	}
  }, [id]);
  

  // Handle avatar upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
	if (e.target.files && e.target.files.length > 0) {
	  const file = e.target.files[0];
	  const formData = new FormData();
	  formData.append('file', file);
  
	  axios
		.post(`http://localhost:3000/api/users/${id}/upload-avatar`, formData, {
		  headers: { 'Content-Type': 'multipart/form-data' },
		})
		.then((response) => {
		  console.log('Avatar uploaded:', response.data); // Log the full response
		  setAvatar(response.data.avatar); // Update state with new avatar URL
		  console.log('Updated avatar URL:', response.data.avatar); // Log the updated avatar URL
		})
		.catch((error) => {
		  console.error('Error uploading avatar:', error);
		});
	}
  };
  

  // Handle username updates
  const updateUsername = (newUsername: string) => {
	if (!newUsername.trim()) {
	  alert('Username cannot be empty');
	  return;
	}
  
	axios
	  .patch(
		`http://localhost:3000/api/users/${userData?.username}/update-username`, // Use the current username
		{ username: newUsername.trim() },
		{ headers: { 'Content-Type': 'application/json' } }
	  )
	  .then((response) => {
		console.log('Username updated successfully:', response.data);
  
		// Update the userData object with the new username
		setUserData((prev: any) => ({
		  ...prev,
		  username: response.data.username,
		}));
	  })
	  .catch((error) => {
		console.error('Error updating username:', error.response?.data || error);
		alert(error.response?.data?.message || 'Failed to update username.');
	  });
  };
  
  

  // Render loading state
  if (loading) return <p>Loading...</p>;

  // Render if no user is found
  if (!userData) return <p>User not found.</p>;

  // Main render
  return (
    <div className="user-page-container">
      <Header
        id={id!} // Pass user ID
        username={userData?.username || ''} // Pass username
        avatar={avatar || defaultAvatar} // Pass avatar
        handleImageChange={handleImageChange} // Pass avatar handler
        setUsername={updateUsername} // Pass username update function
      />
    </div>
  );
};

export default UserPage;

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './Userpage.css';

// Import a local default image if desired (assuming you add the file to your project)
import defaultAvatar from '../assets/Bat.jpg';

const UserPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [userData, setUserData] = useState<any>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // fetch user data from backend
  useEffect(() => {
	if (id) {
	  axios.get(`http://localhost:3000/api/users/${id}`)
		.then((response) => {
		  if (response.data) {
			setUserData(response.data);
			setAvatar(response.data.avatar);
		  } else {
			setUserData(null); // If no data is returned, set to null to trigger the "User not found" message
		  }
		  setLoading(false);
		})
		.catch((error) => {
		  console.error('Error fetching user data:', error);
		  setUserData(null);
		  setLoading(false);
		});
	}
  }, [id]);

  useEffect(() => {
	console.log("Fetching user data for ID:", id); // Debugging line
	if (id) {
	  axios.get(`http://localhost:3000/api/users/${id}`)
		.then((response) => {
		  console.log("Response data:", response.data); // Debugging line
		  if (response.data) {
			setUserData(response.data);
			setAvatar(response.data.avatar);
		  } else {
			setUserData(null);
		  }
		  setLoading(false);
		})
		.catch((error) => {
		  console.error('Error fetching user data:', error);
		  setUserData(null);
		  setLoading(false);
		});
	}
  }, [id]);

  // Handle avatar image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string); // Set new avatar after upload
      };
      reader.readAsDataURL(file);
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
      <div className="profile-container">
        <div className="avatar-container">
          <label htmlFor="avatar-input">
            <img
              src={avatar || defaultAvatar}
              alt="User Avatar"
              className="user-avatar"
            />
          </label>
          <input
            id="avatar-input"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{ display: 'none' }}
          />
        </div>
        <div className="user-info">
          <h1 className="user-name">Hello there, {userData.name}!</h1>
          <p className="user-bio">{userData.bio || 'This is your awesome User Profile page.'}</p>
          <button
            className="message-button"
            onClick={() => alert(`Hello ${userData.name}, welcome to your profile!`)}
          >
            Send Message
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserPage;

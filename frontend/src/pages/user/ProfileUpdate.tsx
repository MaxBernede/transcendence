// UserPage.tsx
import React, { useContext } from 'react';
import { UserContext } from '../../App';
import EditableFieldButton from '../../utils/EditButton';
import axios from 'axios';
import Remove2FAButton from '../../components/2FA/2FARemove';
import TwoFactorAuth from '../../components/2FA/2FA';
import { Box } from '@mui/material';

const UserPage: React.FC = () => {
  const { userData, setUserData, loading, error } = useContext(UserContext);

  const handleChange = async (field: string, value: string) => {
    if (userData?.id) {
      try {
        const token = localStorage.getItem('jwt');  // JWT token from localStorage
        const response = await axios.put(
          `http://localhost:3000/api/users/${userData.id}`,
          { [field]: value },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // Dynamically update the field in userData
        setUserData({ ...userData, [field]: value });
        console.log(`${field} updated:`, response.data);
      } catch (err) {
        console.error(`Error updating ${field}`, err);
      }
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <Box
    display="flex"
    flexDirection="column"
    alignItems="center"
    justifyContent="center"
    minHeight="100vh" // This ensures the content is vertically centered
    padding="2rem" >
      <h1>User Profile</h1>

      {/* Editable username */}
      <EditableFieldButton
        field="username"
        currentValue={userData?.username || ''}
        onSave={handleChange}
      />

      {/* Editable avatar */}
      <EditableFieldButton
        field="avatar"
        currentValue={userData?.avatar || ''}
        onSave={handleChange}
      />

		{/* <EditableFieldButton
        field="phone"
        currentValue={userData?.phone || 'no phone registered yet'}
        onSave={handleChange}
      /> */}

      {/* Other user fields */}
      <div>
        <p>Wins: {userData?.wins}</p>
        <p>Losses: {userData?.losses}</p>
        <p>Ladder Level: {userData?.ladderLevel}</p>
      </div>
      <h2> Two Factor Authentication</h2>
      {userData?.secret_2fa ? (
			<div>✅ Activated: {userData?.secret_2fa}</div>
		) : (
			<div>❌ Disabled: 2FA not enabled yet</div>
		)}
      <Remove2FAButton></Remove2FAButton>
      {/* <Component></Component> */}
      <TwoFactorAuth></TwoFactorAuth>
    </Box>
  );
};

export default UserPage;

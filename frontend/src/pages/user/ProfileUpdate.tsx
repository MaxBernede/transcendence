// UserPage.tsx
import React, { useContext } from 'react';
import { UserContext } from '../../App';
import EditableFieldButton from '../../utils/EditButton';
import axios from 'axios';
import Component from '../../components/LinkButton';
import TwoFA from '../TwoFA';
import Remove2FAButton from '../../components/2FARemove';

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
    <div>
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
      {/* <Component></Component> */}
      <TwoFA></TwoFA>
      <Remove2FAButton></Remove2FAButton>
    </div>
  );
};

export default UserPage;

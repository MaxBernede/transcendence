import React, { useContext, useState } from 'react';
import { UserContext } from '../../App';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import axios from 'axios';
import { buildAvatarUrl } from '../../utils/UserUtils';

const defaultAvatar = '/assets/Bat.jpg';

const AvatarUpdate: React.FC = () => {
  const { userData, setUserData, loading, error } = useContext(UserContext);
  const [avatar, setAvatar] = useState<string | null>(null);

  const handleImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
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

      setUserData((prev: any) => ({
        ...prev!,
        avatar: buildAvatarUrl(response.data.avatar),
      }));
    } catch (error) {
      console.error('Error uploading avatar:', error);
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" flexDirection="column">
      <label htmlFor="avatar-input">
        <Avatar
          src={
            userData?.avatar ||
            `${defaultAvatar}${(avatar || '').includes('?') ? '&' : '?'}t=${new Date().getTime()}`
          }
          alt="User Avatar"
          onError={(e) => {
            console.error('Failed to load avatar, falling back to default.');
            (e.currentTarget as HTMLImageElement).src = defaultAvatar;
          }}
          sx={{
            width: 150,
            height: 150,
            cursor: 'pointer',
            border: '4px solid white',
            boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.6)',
          }}
        />
      </label>
      <input
        id="avatar-input"
        type="file"
        accept="image/*"
        onChange={handleImageChange} // Now it matches the expected signature
        style={{ display: 'none' }}
      />
    </Box>
  );
};

export default AvatarUpdate;

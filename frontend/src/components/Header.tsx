import React, { useState } from 'react';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

import bgImage from '../assets/Background_Header.jpg';
import defaultAvatar from '../assets/Bat.jpg';

export type HeaderProps = {
  username: string | null; // The raw username (e.g., "xyz")
  avatar: string | null; // The user's avatar
  id: string; // The user's ID
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void; // Handler for avatar change
  setUsername: (newUsername: string) => void; // Function to update the username
};

export const Header: React.FC<HeaderProps> = ({ username, avatar, handleImageChange, setUsername }) => {
  const [editing, setEditing] = useState(false);
  const [tempUsername, setTempUsername] = useState<string>(username || ''); // Raw username for editing

  const handleSave = () => {
    setEditing(false);
    setUsername(tempUsername.trim()); // Save only the raw username
  };

  const handleCancel = () => {
    setEditing(false);
    setTempUsername(username || ''); // Reset the editable username
  };

  return (
    <Box component="header" position="relative">
      <Box
        display="flex"
        alignItems="center"
        minHeight="50vh"
        sx={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <Container>
          <Grid container item xs={12} flexDirection="column" justifyContent="center" alignItems="center">
            {/* Avatar */}
            <label htmlFor="avatar-input">
              <Avatar
                src={avatar || defaultAvatar}
                alt={username || 'User Avatar'}
                sx={{
                  width: 250,
                  height: 250,
                  mb: 3,
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
              onChange={handleImageChange}
              style={{ display: 'none' }}
            />

            {/* Username */}
            {!editing ? (
              <>
                <Typography variant="h2" color="white">
                  User: {username || 'Guest'}
                </Typography>
                <button
                  onClick={() => setEditing(true)}
                  style={{
                    marginTop: '10px',
                    padding: '5px 10px',
                    fontSize: '16px',
                    cursor: 'pointer',
                  }}
                >
                  Edit Username
                </button>
              </>
            ) : (
              <div style={{ marginTop: '10px' }}>
                <span
                  style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: 'white',
                    marginRight: '10px',
                  }}
                >
                  User:
                </span>
                <input
                  type="text"
                  value={tempUsername}
                  onChange={(e) => setTempUsername(e.target.value)}
                  style={{
                    padding: '5px',
                    fontSize: '18px',
                  }}
                />
                <button
                  onClick={handleSave}
                  style={{
                    marginLeft: '5px',
                    padding: '5px 10px',
                    fontSize: '16px',
                    cursor: 'pointer',
                  }}
                >
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  style={{
                    marginLeft: '5px',
                    padding: '5px 10px',
                    fontSize: '16px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

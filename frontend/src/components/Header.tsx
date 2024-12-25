import React, { useState } from 'react';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import bgImage from '../assets/Background_Header.jpg';
import defaultAvatar from '../assets/Bat.jpg';

type HeaderProps = {
  id: string; // Add the `id` property here
  username: string | null;
  avatar: string | null;
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setUsername: (newUsername: string) => void;
};

export const Header: React.FC<HeaderProps> = ({
  id,
  username,
  avatar,
  handleImageChange,
  setUsername,
}) => {
  const [editing, setEditing] = useState(false);
  const [tempUsername, setTempUsername] = useState<string>(username || '');

  const handleSave = () => {
    if (!tempUsername.trim()) {
      alert('Username cannot be empty.');
      return;
    }
    setEditing(false);
    setUsername(tempUsername.trim());
  };

  return (
    <Box component="header" position="relative" sx={{ width: '100%' }}>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minHeight="60vh"
        sx={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
        }}
      >
        <Container>
          <Grid
            container
            item
            xs={12}
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
          >
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
            {!editing ? (
              <>
                <Typography variant="h2" color="white">
                  User: {username || 'Guest'}
                </Typography>
                <button onClick={() => setEditing(true)}>Edit Username</button>
              </>
            ) : (
              <div>
                <input
                  type="text"
                  value={tempUsername}
                  onChange={(e) => setTempUsername(e.target.value)}
                />
                <button onClick={handleSave}>Save</button>
                <button onClick={() => setEditing(false)}>Cancel</button>
              </div>
            )}
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};
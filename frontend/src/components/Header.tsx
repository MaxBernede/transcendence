import React from 'react';
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

import bgImage from "../assets/Background_Header.jpg";
import defaultAvatar from "../assets/Bat.jpg";

type HeaderProps = {
  username: string | null;
  avatar: string | null;
  setAvatar: (avatar: string) => void; // Function to update the avatar state
  id: string; // The user's id
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void; // Image change handler
};

const Header: React.FC<HeaderProps> = ({ username, avatar, handleImageChange }) => {
  return (
    <Box component="header" position="relative">
      <Box
        display="flex"
        alignItems="center"
        minHeight="50vh"
        sx={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${bgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
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
                  width: 250, // Larger avatar size
                  height: 250,
                  mb: 3,
                  cursor: 'pointer',
                  border: "4px solid white",
                  boxShadow: "0px 8px 20px rgba(0, 0, 0, 0.6)"
                }}
              />
            </label>
            <input
              id="avatar-input"
              type="file"
              accept="image/*"
              onChange={handleImageChange} // Now using handleImageChange directly
              style={{ display: 'none' }}
            />
            {/* Username */}
            <Typography variant="h2" color="white">
              {username || 'Guest'}
            </Typography>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default Header;

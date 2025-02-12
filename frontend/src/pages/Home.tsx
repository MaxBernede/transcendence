 
import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import LoginButton from '../components/Loginbutton';

// for image 
// import background from file
// sx={{
//   display: 'flex',
//   flexDirection: 'column',
//   alignItems: 'center',
//   justifyContent: 'center',
//   height: '100vh',
//   backgroundImage: `url(${background})`,
//   backgroundSize: 'cover',
//   backgroundPosition: 'center',
//   backgroundRepeat: 'no-repeat',
// }}

const Home: React.FC = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#f5f5f5',
      }}
    >
      <Typography variant="h3" color="primary" gutterBottom>
        Welcome to our Transcendence project!
      </Typography>
      <Typography variant="body1" color="textSecondary" sx={{ textAlign: 'center', maxWidth: '400px' }}>
        Feel free to login using your intra. Have fun playing our game
      </Typography>
      <LoginButton></LoginButton>
    </Box>
  );
};

export default Home;
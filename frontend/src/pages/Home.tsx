 
import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';

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
        Welcome to the Home Page
      </Typography>
      <Typography variant="body1" color="textSecondary" sx={{ textAlign: 'center', maxWidth: '400px' }}>
        This is a placeholder for the home page. You can add content, links, or other components here as your project grows.
      </Typography>
      <Button
        variant="contained"
        color="primary"
        component={Link}
        to="/user/ivan-mel"
        sx={{ marginTop: '20px' }}
      >
        Go to Ivan Mel's Profile
      </Button>
    </Box>
  );
};

export default Home;
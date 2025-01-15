import React, { useContext, useEffect } from 'react';
import TwoFactorAuth from '../components/2FA';
import { UserContext } from '../App'; // Import UserContext
import { fetchUserData } from '../utils/UserLogic';
import { Box, Typography, Button } from '@mui/material';

const TwoFA: React.FC = () => {

  const { userData, setUserData, loading, error, achievements, setAchievements, matchHistory, setMatchHistory } = useContext(UserContext); // Use context

  useEffect(() => {
	if (!userData) {
	  // If userData is not available, fetch it
	  fetchUserData(setUserData, setAchievements, setMatchHistory, () => {}, () => {});
	}
  }, [userData, setUserData, setAchievements, setMatchHistory]);

  return (
	<Box>
		<TwoFactorAuth></TwoFactorAuth>
		{/* Below to check if the usercontext work */}
		<p>userId: {userData?.intraId}</p>
	</Box>
  );
};

export default TwoFA;
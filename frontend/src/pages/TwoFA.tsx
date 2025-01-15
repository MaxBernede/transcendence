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
	<div>
		<TwoFactorAuth></TwoFactorAuth>
		{/* Below to check if the usercontext work */}
		{userData?.secret_2fa ? (
			<h2>✅ Activated: Secret2FA: {userData?.secret_2fa}</h2>
		) : (
			<h2>❌ Disabled: 2FA not enabled yet</h2>
		)}
	</div>
  );
};

export default TwoFA;
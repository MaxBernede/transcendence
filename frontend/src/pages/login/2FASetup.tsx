import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import TwoFactorAuthLogin from '../../components/2FA/2FALogin';
import { useLocation } from 'react-router-dom';

const TwoFASetup: React.FC = () => {
	const location = useLocation();
	const [userId, setUserId] = useState<string | null>(null);

	// Extract user ID from query string
	useEffect(() => {
		const params = new URLSearchParams(location.search);
		const id = params.get('id');
		if (id) {
			setUserId(id);
			// Optionally, save it to localStorage to persist across page reloads
			localStorage.setItem('userId', id);
		}
	}, [location]);
	return (
		<Box
			display="flex"
			flexDirection="column"
			justifyContent="center"
			alignItems="center"
			height="100vh" // Center vertically
			textAlign="center"
		>
			<Typography variant="h4" gutterBottom>
				Two-Factor Authentication
				{userId && <p>User ID: {userId}</p>}
			</Typography>
			<p>You have 2 minutes to log in</p>
			
			<TwoFactorAuthLogin />
		</Box>
	);
};

export default TwoFASetup;

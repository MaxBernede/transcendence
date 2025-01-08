import React from 'react';
import { Button } from '@mui/material';
import axios from 'axios';

const LogoutButton: React.FC = () => {
	// cookies eraser
	const handleLogout = async () => {
		try {
			// Make a request to the server to clear the cookie
			await axios.post('http://localhost:3000/auth/logout', {}, { withCredentials: true });
	
			// Optionally, refresh the page
			window.location.href = '/';
		} catch (error) {
			console.error('Error during logout:', error);
			alert('Failed to log out');
		}
	};

	return (
		<div className={'mainContainer'}>
			<br />
			<div className={'inputContainer'}>
				<Button
					variant="contained"
					color="error"  // button color red for error
					sx={{ marginTop: '20px' }}
					onClick={handleLogout}
				>
					Log Out
				</Button>
			</div>
		</div>
	);
};

export default LogoutButton;

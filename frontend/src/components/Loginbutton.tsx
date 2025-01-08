import React from 'react';
import Button from '@mui/material/Button';
import axios from 'axios';

// Login will redirect to loginbackend to save in the front the user and jwt
const LoginButton = () => {
	const handleLogin = async () => {
		try {
			const response = await axios.get('http://localhost:3000/auth/', { //Auth will call the getAuth
				withCredentials: true, // Include cookies (not necessary)
			});
			window.location.href = response.data.url; // redirect toward the login
		} catch (error) {
			console.error('Error in the connexion :', error);
			alert('error in the connexion process');
		}
	};

	return (
		<div className={'mainContainer'}>
			<div className={'titleContainer'}>
				<div>Login</div>
			</div>
			<br />
			<div className={'inputContainer'}>
				<Button
					variant="contained"
					color="primary"
					sx={{ marginTop: '20px' }}
					onClick={handleLogin}
				>
					Log in with 42
				</Button>
			</div>
		</div>
	);
};

export default LoginButton;

import React from 'react';
import axios from 'axios';

const LoginButton = () => {
	const handleLogin = async () => {
		try {
			// Call the backend to initiate the 42 OAuth flow
			const response = await axios.get('http://localhost:3000/auth/loginintra', {
				withCredentials: true, // Include cookies if needed
			});

			// Redirect the user to the 42 login page
			window.location.href = response.data.url;
		} catch (error) {
			console.error('Error during login:', error);
			alert('Failed to start login process');
		}
	};

	return (
		<div>
			<h1>Login to 42</h1>
			<button onClick={handleLogin}>Login with 42</button>
		</div>
	);
};

export default LoginButton;

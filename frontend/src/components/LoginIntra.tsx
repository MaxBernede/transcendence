import React, { useEffect } from 'react';
import axios from 'axios';

const LoginButton = () => {
	const handleLogin = async () => {
		try {
			// Call the backend to initiate the 42 OAuth flow
			const response = await axios.get('http://localhost:3000/users/loginintra', {
				withCredentials: true, // Include cookies if needed
			});

			// Redirect the user to the 42 login page
			window.location.href = response.data.url;
		} catch (error) {
			console.error('Error during login:', error);
			alert('Failed to start login process');
		}
	};

	useEffect(() => {
		// Check if there's a token in the URL
		const urlParams = new URLSearchParams(window.location.search);
		const token = urlParams.get('token');
	
		if (token) {
		  // Store the token
		  localStorage.setItem('jwt', token);
		  console.log('JWT stored:', token);
	
		  // Redirect to the intra call again ?
		  window.location.href = 'http://localhost:3001'; // Or another page
		}
	  }, []);

	return (
		<div>
			<h1>Login to 42</h1>
			<button onClick={handleLogin}>Login with 42</button>
		</div>
	);
};

export default LoginButton;

import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/App.css'

const Loginbackend = () => {
  const navigate = useNavigate();

  useEffect(() => {
	const urlParams = new URLSearchParams(window.location.search);
	const token = urlParams.get('token');
	const user = urlParams.get('user');
  
	if (token && user) {
	  try {
		// Decode the user data from the URL
		const parsedUser = JSON.parse(decodeURIComponent(user));  // Decode and parse the user data
		localStorage.setItem('jwt', decodeURIComponent(token));  // Store the token
  
		console.log('Token:', decodeURIComponent(token));
		console.log('User data:', parsedUser);
		window.location.href = 'http://localhost:3001'; // Redirect to another page if needed
	  } catch (error) {
		console.error('Error parsing user data:', error);
	  }
	}
  }, []);

    return (
		<div>How did you end up there ?</div>
    )
}
export default Loginbackend
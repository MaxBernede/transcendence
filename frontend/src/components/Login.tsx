import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import '../App.css'
import axios from 'axios'

const Login = () => {
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const response = await axios.get('http://localhost:3000/auth/', { //Auth will call the getAuth
        withCredentials: true, // Include cookies if needed
      });

      window.location.href = response.data.url; // Redirect the user to the 42 login page
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
      // Vérifiez si le token est un objet JSON (exemple pour débogage) :
      try {
        const parsedToken = JSON.parse(token); // If your backend sends a JSON object encoded
        localStorage.setItem('jwt', JSON.stringify(parsedToken));
        console.log('JWT parsed and stored:', parsedToken);
      } catch (error) {
        // Otherwise, store the token directly if it's a simple string
        localStorage.setItem('jwt', token);
        console.log('JWT stored:', token);
      }

      // Redirect to another page after storing the token
      window.location.href = 'http://localhost:3001'; // Or another route
    }
  }, []);

    return (
      <div className={'mainContainer'}>
        <div className={'titleContainer'}>
          <div>Login</div>
        </div>
        <br />
        <div className={'inputContainer'}>
          <input 
            className={'inputButton'} 
            type="button" 
            onClick={handleLogin} 
            value={'Log in with 42'} 
          />
        </div>
      </div>
    )
}
export default Login
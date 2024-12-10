import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import '../App.css'
import axios from 'axios'

// Login will redirect to loginbackend to save in the front the user and jwt
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
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../App.css'
import axios from 'axios'

interface LoginProps {
  setLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  setEmail: React.Dispatch<React.SetStateAction<string>>;
}

const Login: React.FC<LoginProps> = ({ setLoggedIn, setEmail}) => {
  const [localEmail, setLocalEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const navigate = useNavigate()

  const onButtonClick = async () => {
	// Set initial error values to empty
	setEmailError('')
	setPasswordError('')
	setErrorMessage('')

	//Not empty
	if ('' === localEmail) {
		setEmailError('Please enter your email');
		return;
	}

	//Regex to test the email
	if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(localEmail)) {
		setEmailError('Please enter a valid email');
		return;
	}

	// not empty
	if ('' === password) {
		setPasswordError('Please enter a password');
		return;
	}

	// len min
	if (password.length < 7) {
		setPasswordError('The password must be 8 characters or longer');
		return;
	}

    try {
		// Send the login request to your NestJS backend
		const response = await axios.post('http://localhost:3000/users/auth', {
		  email: localEmail,
		  password: password,
		})
  
		if (response.status === 200) {
		  // Assuming the backend returns a JWT token
		  const token = response.data.token
  
		  // Store the JWT token in localStorage or a state manager (Redux, etc.)
		  localStorage.setItem('authToken', token)
  
		  // Set the logged-in state and email in the parent component
		  setLoggedIn(true)
		  setEmail(localEmail)
  
		  // Navigate to the home page
		  navigate('/')
		}
	  } catch (error) {
		console.error('Login failed:', error)
		setErrorMessage('Login failed. Please check your credentials.')
	  }
	// Update the parent state (setLoggedIn and setEmail)
	// setLoggedIn(true);        // This updates the parent state in App
	// setEmail(localEmail);		// change the email in App with the local one

	// // Navigate to the home page
	// navigate('/');
  }

  return (
	<div className={'mainContainer'}>
	  <div className={'titleContainer'}>
		<div>Login</div>
	  </div>
	  <br />
	  <div className={'inputContainer'}>
		<input
		  value={localEmail}
		  placeholder="Enter your email here"
		  onChange={(ev) => setLocalEmail(ev.target.value)}
		  className={'inputBox'}
		/>
		<label className="errorLabel">{emailError}</label>
	  </div>
	  <br />
	  <div className={'inputContainer'}>
		<input
		  value={password}
		  placeholder="Enter your password here"
		  onChange={(ev) => setPassword(ev.target.value)}
		  className={'inputBox'}
		  type="password"
		/>
		<label className="errorLabel">{passwordError}</label>
	  </div>
	  <br />
	  {errorMessage && <div className="errorMessage">{errorMessage}</div>}
	  <div className={'inputContainer'}>
		<input className={'inputButton'} type="button" onClick={onButtonClick} value={'Log in'} />
	  </div>
	</div>
  )
}

export default Login
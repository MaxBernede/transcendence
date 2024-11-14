import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../App.css'

interface LoginProps {
  setLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  setEmail: React.Dispatch<React.SetStateAction<string>>;
}

const Login: React.FC<LoginProps> = ({ setLoggedIn, setEmail}) => {
  const [localEmail, setLocalEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const navigate = useNavigate()

  const onButtonClick = () => {
	// Set initial error values to empty
	setEmailError('')
	setPasswordError('')

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

	// Update the parent state (setLoggedIn and setEmail)
	setLoggedIn(true);        // This updates the parent state in App
	setEmail(localEmail);		// change the email in App with the local one

	// Navigate to the home page
	navigate('/');
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
		/>
		<label className="errorLabel">{passwordError}</label>
	  </div>
	  <br />
	  <div className={'inputContainer'}>
		<input className={'inputButton'} type="button" onClick={onButtonClick} value={'Log in'} />
	  </div>
	</div>
  )
}

export default Login
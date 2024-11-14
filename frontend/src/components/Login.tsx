import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

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
    // Perform validation
    if (localEmail === '' || password === '') {
      if (localEmail === '') setEmailError('Email is required');
      if (password === '') setPasswordError('Password is required');
      return;
    }

    // Update the parent state (setLoggedIn and setEmail)
    setLoggedIn(true);        // This updates the parent state in App
    setEmail(localEmail);          // This updates the email in parent state

    // Navigate to the home page or other page
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
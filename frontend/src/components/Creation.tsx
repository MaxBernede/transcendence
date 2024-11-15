import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../App.css'

interface CreationProps {
  setLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  setEmail: React.Dispatch<React.SetStateAction<string>>;
}

const Creation: React.FC<CreationProps> = ({ setLoggedIn, setEmail }) => {
  const [username, setUsername] = useState('')
  const [email, setEmailState] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [usernameError, setUsernameError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [confirmPasswordError, setConfirmPasswordError] = useState('')

  const navigate = useNavigate()

  const onButtonClick = () => {
    // Clear previous errors
    setUsernameError('')
    setEmailError('')
    setPasswordError('')
    setConfirmPasswordError('')

    // Validate fields
    if ('' === username) {
      setUsernameError('Please enter your username')
      return
    }

    if ('' === email) {
      setEmailError('Please enter your email')
      return
    }

    if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
      setEmailError('Please enter a valid email')
      return
    }

    if ('' === password) {
      setPasswordError('Please enter a password')
      return
    }

    if (password.length < 7) {
      setPasswordError('The password must be at least 7 characters long')
      return
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match')
      return
    }

    // Set logged in state and email
    setLoggedIn(true)
    setEmail(email)

    // Navigate to the home page
    navigate('/')
  }

  return (
    <div className={'mainContainer'}>
      <div className={'titleContainer'}>
        <div>Create Account</div>
      </div>
      <br />
      <div className={'inputContainer'}>
        <input
          value={username}
          placeholder="Enter your username here"
          onChange={(ev) => setUsername(ev.target.value)}
          className={'inputBox'}
        />
        <label className="errorLabel">{usernameError}</label>
      </div>
      <br />
      <div className={'inputContainer'}>
        <input
          value={email}
          placeholder="Enter your email here"
          onChange={(ev) => setEmailState(ev.target.value)}
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
      <div className={'inputContainer'}>
        <input
          value={confirmPassword}
          placeholder="Confirm your password"
          onChange={(ev) => setConfirmPassword(ev.target.value)}
          className={'inputBox'}
          type="password"
        />
        <label className="errorLabel">{confirmPasswordError}</label>
      </div>
      <br />
      <div className={'inputContainer'}>
        <input className={'inputButton'} type="button" onClick={onButtonClick} value={'Create Account'} />
      </div>
    </div>
  )
}

export default Creation

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../App.css'
import axios from 'axios'

interface LoginProps {
  setLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  setEmail: React.Dispatch<React.SetStateAction<string>>;
}

const LoginSave: React.FC<LoginProps> = ({ setLoggedIn, setEmail}) => {
	const [localEmail, setLocalEmail] = useState('');
	const [password, setPassword] = useState('');
	const [errors, setErrors] = useState({ email: '', password: '', global: '' });
	const navigate = useNavigate();


  // Validate inputs
  const validateInputs = (): boolean => {
    const newErrors = { email: '', password: '', global: '' };

    if (!localEmail) newErrors.email = 'Please enter your email or username';
    else if (localEmail.length < 5) newErrors.email = 'Email or username must be at least 5 characters long';

    if (!password) newErrors.password = 'Please enter a password';
    else if (password.length < 5) newErrors.password = 'Password must be at least 5 characters long';

    setErrors(newErrors);
    return Object.values(newErrors).every((error) => !error);
  };

  const onButtonClick = async () => {
    // Reset errors
    setErrors({ email: '', password: '', global: '' });

    if (!validateInputs()) return

    try {
        // Send the login request to your NestJS backend
        const response = await axios.post('http://localhost:3000/users/auth', {
          email: localEmail,
          password: password,
        })
  
        if (response.status === 200) {

          const token = response.data.token // Response should give JWT
  
          localStorage.setItem('authToken', token) // Store JWT token
  
          // Set the logged-in state and email in the parent component
          setLoggedIn(true)
          setEmail(localEmail)
  
          navigate('/') // Navigate to the home page
        }
      } catch (error) {
        console.error('Login failed:', error)
        setErrors((prev) => ({ ...prev, global: 'Login failed. Please check your credentials.' }));
      }
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
        {errors.email && <label className="errorLabel">{errors.email}</label>}
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
        {errors.password && <label className="errorLabel">{errors.password}</label>}
        {errors.global && <div className="errorLabel">{errors.global}</div>}
      </div>
      <br />
      <div className={'inputContainer'}>
        < input className={'inputButton'} type="button" onClick={onButtonClick} value={'Log in'} />
      </div>
    </div>
  )
}

export default LoginSave
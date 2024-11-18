import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../App.css'
import axios from 'axios'

interface CreationProps {
	setLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
	setEmail: React.Dispatch<React.SetStateAction<string>>;
}

const Creation: React.FC<CreationProps> = ({ setLoggedIn, setEmail }) => {
	const [username, setUsername] = useState('')
	const [email, setEmailState] = useState('')
	const [password, setPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [errors, setErrors] = useState({
		username: '',
		email: '',
		password: '',
		confirmPassword: '',
	})
	const [errorMessage, setErrorMessage] = useState('')
	const navigate = useNavigate()

	const validateInputs = (): boolean => {
		const newErrors = { username: '', email: '', password: '', confirmPassword: '' }

		if (!username) newErrors.username = 'Please enter your username'
		if (!email) newErrors.email = 'Please enter your email'
		if (!password) newErrors.password = 'Please enter a password'
		else if (password.length < 7) newErrors.password = 'Password must be at least 7 characters long'
		if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match'

		setErrors(newErrors)
		return Object.values(newErrors).every((error) => !error)
	}

	const handleAccountCreation = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!validateInputs()) return

		try {
			// Send account creation request to the backend
			const response = await axios.post('http://localhost:3000/users/register', {
				email,
				password,
			})

			if (response.status === 201) {
				alert('Account successfully created!')
				navigate('/login')
			}
		} catch (error) {
			console.error('Account creation failed:', error)
			setErrorMessage('Account creation failed. Please try again.')
		}
	}

	return (
		<div className="mainContainer">
			<div className="titleContainer">
				<div>Create Account</div>
			</div>
			<br />
			<form onSubmit={handleAccountCreation}>
				<div className="inputContainer">
					<input
						value={username}
						placeholder="Enter your username here"
						onChange={(e) => setUsername(e.target.value)}
						className="inputBox"
					/>
					<label className="errorLabel">{errors.username}</label>
				</div>
				<br />
				<div className="inputContainer">
					<input
						value={email}
						placeholder="Enter your email here"
						onChange={(e) => setEmailState(e.target.value)}
						className="inputBox"
					/>
					<label className="errorLabel">{errors.email}</label>
				</div>
				<br />
				<div className="inputContainer">
					<input
						value={password}
						placeholder="Enter your password here"
						onChange={(e) => setPassword(e.target.value)}
						className="inputBox"
						type="password"
					/>
					<label className="errorLabel">{errors.password}</label>
				</div>
				<br />
				<div className="inputContainer">
					<input
						value={confirmPassword}
						placeholder="Confirm your password"
						onChange={(e) => setConfirmPassword(e.target.value)}
						className="inputBox"
						type="password"
					/>
					<label className="errorLabel">{errors.confirmPassword}</label>
				</div>
				<br />
				<div className={'inputContainer'}>
          <input className={'inputButton'} type="button" onClick={handleAccountCreation} value={'Create account'} />
				</div>
				{errorMessage && <p className="errorLabel">{errorMessage}</p>}
			</form>
		</div>
	)
}

export default Creation

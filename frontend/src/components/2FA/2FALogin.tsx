import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../../App';
import { fetchUserData } from '../../utils/UserLogic';


const TwoFactorAuthLogin = () => {
	const [otp, setOtp] = useState('');
	const [isValid, setIsValid] = useState(null);
	const { userData, setUserData, loading, error, achievements, setAchievements, matchHistory, setMatchHistory } = useContext(UserContext); // Use context

	useEffect(() => {
		if (!userData) {
		// If userData is not available, fetch it
		fetchUserData(setUserData, setAchievements, setMatchHistory, () => {}, () => {});
		}
	}, [userData, setUserData, setAchievements, setMatchHistory]);

	const verifyLogin2FA = async () => {
		try {
			const response = await fetch('http://localhost:3000/2fa/verify', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					token: otp,
					intraId: userData?.id,
				}),
			});
			const data = await response.json();
			setIsValid(data.isValid);

			if (!data.isValid) {
				setTimeout(() => {
					window.location.reload();
				}, 2000);
			}
		} catch (error) {
			console.error('Error verifying 2FA:', error);
		}
	};

	return (
		<div>
		{/* <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center'}}> */}
				<div>
					<h2>Auth code:</h2>
					<input
						type="text"
						placeholder="Enter the Authentication code"
						value={otp}
						onChange={(e) => setOtp(e.target.value)}
						style={{
							color: 'black', // Ensure text is visible
							backgroundColor: 'white', // Set a clear background
							border: '1px solid black', // Make it stand out
							padding: '5px',
						  }}
					/>
					<button onClick={verifyLogin2FA}                   style={{
                    color: 'black', // Ensure text is visible
                    backgroundColor: 'white', // Set a clear background
                    border: '1px solid black', // Make it stand out
                    padding: '5px',
                  }}>
						Login
					</button>
					{isValid !== null && (
						<div style={{ marginTop: '20px' }}>
							<h3>{isValid ? '✅ OTP is valid!' : '❌ OTP is invalid.'}</h3>
						</div>
					)}
				</div>
		</div>
	);
};

export default TwoFactorAuthLogin;

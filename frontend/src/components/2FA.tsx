import React, { useState } from 'react';
import useAuth from '../utils/useAuth';

// Show the QR with a random generated secret
// If QR is validated : save it in the DBB for the user
// If not, refuse the login and ask again until it works

// When loggin, check if 2FA is activated
// If yes, dont generate a secret but retrieve the one from the user
// Then just wait for the correct code

// Workflow Example
// Registration Phase:

//     User enables 2FA.
//     Backend generates a secret and QR code.
//     User scans QR code and validates OTP.
//     Backend saves the secret in the database.

// Login Phase:

//     User logs in with credentials.
//     Backend checks credentials and requests OTP.
//     User provides OTP.
//     Backend verifies OTP using the saved secret.

const TwoFactorAuth = () => {
	const [qrCode, setQrCode] = useState('');
	const [secret, setSecret] = useState('');
	const [otp, setOtp] = useState('');
	const [isValid, setIsValid] = useState(null);

	//! make it so no access if not logged in
	const { isAuthenticated, isLoading } = useAuth();

	// If still loading or not authenticated, do not render the navbar
	if (isLoading || !isAuthenticated) {
		return null;
	}

	// Fetch secret and QR code
	const generate2FA = async () => {
		try {
			const response = await fetch('http://localhost:3000/2fa/generate');
			const data = await response.json();
			setQrCode(data.qrCode);
			setSecret(data.secret);
		} catch (error) {
			console.error('Error generating 2FA:', error);
		}
	};

	// Verify OTP
	const verify2FA = async () => {
		try {
			const response = await fetch('http://localhost:3000/2fa/verify', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ secret, token: otp }),
			});
			const data = await response.json();
			setIsValid(data.isValid);
		} catch (error) {
			console.error('Error verifying 2FA:', error);
		}
	};

	return (
		<div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
			<h1>Two-Factor Authentication</h1>
			<button onClick={generate2FA} style={{ padding: '10px', marginBottom: '20px' }}>
				Generate QR Code
			</button>

			{qrCode && (
				<div>
					<h2>Scan this QR Code</h2>
					<img src={qrCode} alt="QR Code" style={{ border: '1px solid #ddd', padding: '10px' }} />
					{/* Remove the secret after, just for debugging */}
					<p>Secret: <strong>{secret}</strong></p>
				</div>
			)}

			{secret && (
				<div style={{ marginTop: '20px' }}>
					<h2>Verify OTP</h2>
					<input
						type="text"
						placeholder="Enter OTP"
						value={otp}
						onChange={(e) => setOtp(e.target.value)}
						style={{ padding: '10px', marginRight: '10px', width: '200px' }}
					/>
					<button onClick={verify2FA} style={{ padding: '10px' }}>
						Verify
					</button>
				</div>
			)}

			{isValid !== null && (
				<div style={{ marginTop: '20px' }}>
					<h3>{isValid ? '✅ OTP is valid!' : '❌ OTP is invalid.'}</h3>
				</div>
			)}
		</div>
	);
};

export default TwoFactorAuth;

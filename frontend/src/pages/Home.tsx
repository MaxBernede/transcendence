import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface LoginProps {
	loggedIn: boolean;
	email: string;
	setLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
}

const Home: React.FC<LoginProps> = ({ loggedIn, email, setLoggedIn }) => {
	const navigate = useNavigate();
	const [userName, setUserName] = useState<string | null>(null);

	// Parse cookies and extract userData
	useEffect(() => {
		const getCookie = (name: string) => {
			const value = `; ${document.cookie}`;
			const parts = value.split(`; ${name}=`);
			if (parts.length === 2) return parts.pop()?.split(';').shift();
			return null;
		};

		// Check if the userData cookie exists and parse it
		const userDataCookie = getCookie('userData');
		if (userDataCookie) {
			try {
				const userData = JSON.parse(userDataCookie);
				setUserName(userData.first_name);
			} catch (error) {
				console.error('Failed to parse userData cookie:', error);
			}
		}
	}, []);

	const onButtonClick = () => {
		setLoggedIn(!loggedIn);
	};

	return (
		<div className="mainContainer">
			<div className="titleContainer">
				<div>Welcome{userName ? `, ${userName}` : '!'}</div>
			</div>
			<div>This is the home page.</div>
			<div className="buttonContainer">
				<input
					className="inputButton"
					type="button"
					onClick={onButtonClick}
					value={loggedIn ? 'Log out' : 'Log in'}
				/>
				{loggedIn ? <div>Your email address is {email}</div> : <div />}
			</div>
		</div>
	);
};

export default Home;

import React, { useEffect, useState } from 'react';
import LogoutButton from '../components/auth/Logout';

const Home: React.FC = () => {
	const [userData, setUserData] = useState<any>(null);

	useEffect(() => {
  	console.log('useEffect has been called! from home component');
		// Fonction pour récupérer et décoder un cookie spécifique
		const getCookieValue = (cookieName: string): string | undefined => {
			const cookies = document.cookie.split('; ');
			const targetCookie = cookies.find((cookie) => cookie.startsWith(`${cookieName}=`));
			if (targetCookie) {
				const rawValue = targetCookie.split('=')[1];
				return decodeURIComponent(rawValue); // Décodage de la valeur
			}
			return undefined;
		};

		// Lire et décoder le cookie "userData"
		const cookieValue = getCookieValue('userData');
		if (cookieValue) {
			try {
				const parsedData = JSON.parse(cookieValue); // Parser le JSON
				setUserData(parsedData);
			} catch (error) {
				console.error('Erreur lors du parsing du cookie JSON :', error);
			}
		}
	}, []);

	return (
    <div>
  <h1>Home Page</h1>
  {userData ? (
    <div>
      <p>Email : {userData.email}</p>
      <p>First name : {userData.first_name}</p>
      <p>Last name : {userData.last_name}</p>
      <p>
        Picture: 
        <img
          src={userData.image.link}
          alt="User profile"
          style={{ width: '200px', height: '200px' }} // Optional: adjust size
        />
      </p>
      <LogoutButton />
    </div>
  ) : (
    <p>No user datas in the cookies.</p>
  )}
</div>
	);
};

export default Home;

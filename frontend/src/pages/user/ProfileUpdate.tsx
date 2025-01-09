import React, { useEffect, useState } from 'react';

const API_URL = 'http://localhost:3000/auth/me';

interface User {
	id: number;
	firstName: string;
	lastName: string;
	email: string;
	double_auth_active : boolean;
	phone_number : number;
	username: string;
}

export default function Profile() {
	const [user, setUser] = useState<User | null>(null);
	const [error, setError] = useState('');

	useEffect(() => {
		const token = localStorage.getItem('jwt_token'); // Récupérer le token depuis le stockage local

		if (token) {
			fetch(API_URL, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${token}`, // Inclure le token dans l'en-tête
				},
			})
				.then((response) => {
					if (!response.ok) {
						throw new Error('Failed to fetch user info');
					}
					return response.json();
				})
				.then((data) => setUser(data))
				.catch((err) => setError(err.message));
		} else {
			setError('User not logged in');
		}
	}, []);

	if (error) {
		return <div>Error: {error}</div>;
	}

	if (!user) {
		return <div>Loading...</div>;
	}

	return (
		<div>
			<p>Email: {user.email}</p>
		</div>
	);
}

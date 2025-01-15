
import { useState, useEffect } from 'react';
import axios from 'axios';

	//! BASICALLY ADD THAT IN THE BEGINNING OF A COMPONENT
	//! IF YOU WANT TO HIDE IT WHEN NOT LOGGED IN

	// const { isAuthenticated, isLoading } = useAuth();

	// // If still loading or not authenticated, do not render the navbar
	// if (isLoading || !isAuthenticated) {
	// 	return null;
	// }

const useAuth = () => {
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		axios
			.get('/auth/verify', { withCredentials: true })
			.then((response) => {
				setIsAuthenticated(response.data.authenticated);
			})
			.catch(() => {
				setIsAuthenticated(false);
			})
			.finally(() => {
				setIsLoading(false);
			});
	}, []);

	return { isAuthenticated, isLoading };
};

export default useAuth;

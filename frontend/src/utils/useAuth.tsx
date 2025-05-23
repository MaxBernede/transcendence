
import { useState, useEffect } from 'react';
import axios from 'axios';


const useAuth = () => {
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		axios
			.get(`${process.env.REACT_APP_BACKEND_IP}/auth/verify`, {
				withCredentials: true,
			})
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

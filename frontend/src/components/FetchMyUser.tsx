import { useEffect } from 'react';

interface Props {
	setUserData: (user: any) => void;
}

const FetchMyUser: React.FC<Props> = ({ setUserData }) => {
	useEffect(() => {
		const fetchMe = async () => {
			try {
				const token = localStorage.getItem('jwt');
				const res = await fetch(`${process.env.REACT_APP_BACKEND_IP}/api/users/me`, {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});
				if (!res.ok) throw new Error('Failed to fetch /me');
				const user = await res.json();
				setUserData(user);
			} catch (err) {
				console.error('Error fetching /me:', err);
			}
		};

		fetchMe();
	}, [setUserData]);

	return null; // component does not render anything
};

export default FetchMyUser;
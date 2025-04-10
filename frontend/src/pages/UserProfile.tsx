import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar"; 

// ✅ Define UserData type for scalability
interface UserData {
	username: string;
	avatar: string;
}

const bgImage = '/assets/Background_Header.jpg';


const UserProfile: React.FC = () => {
	const { id } = useParams<{ id: string }>();
	const [userData, setUserData] = useState<UserData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchUserData = async () => {
			try {
				const response = await fetch(`/api/users/${id}`);
				console.log("response:", response);
				if (!response.ok) throw new Error('User not found');

				const jsonData = await response.json();
				const userData: UserData = { username: jsonData.username, avatar: jsonData.avatar };

				setUserData(userData);
			} catch (err) {
				setError((err as Error).message);
			} finally {
				setLoading(false);
			}
		};

		fetchUserData();
	}, [id]);

	if (loading) return <p>Loading...</p>;
	if (error) return <p>{error}</p>;

	return (
		<div className="user-page-container">
		<Box component="header" position="relative" sx={{ width: '100%' }}>
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="60vh"
        sx={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
        }}
      >
        <Avatar className="h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 lg:h-36 lg:w-36">
          <AvatarImage src={userData?.avatar ?? undefined} alt="User Avatar" />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
      <Typography variant="h4" component="h1">
        Username: {userData?.username}
      </Typography>

      </Box>
    </Box>
	</div>
	);
};

export default UserProfile;

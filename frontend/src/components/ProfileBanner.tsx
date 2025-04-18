import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar"; 

const bgImage = '/assets/Background_Header.jpg';

interface ProfileBannerProps {
	username: string;
	avatar?: string | null;
}

const ProfileBanner: React.FC<ProfileBannerProps> = ({ username, avatar }) => {
	return (
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
					<AvatarImage src={avatar ?? undefined} alt="User Avatar" />
					<AvatarFallback>U</AvatarFallback>
				</Avatar>
				<Typography variant="h4" component="h1">
					Username: {username}
				</Typography>
			</Box>
		</Box>
	);
};

export default ProfileBanner;

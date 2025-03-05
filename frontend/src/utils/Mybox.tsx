"use client";

import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Avatar, AvatarImage, AvatarFallback } from "@radix-ui/react-avatar";
import { UserContext } from "../App";
import { useContext } from "react";
import { UserData } from "./UserLogic";

const bgImage = "/assets/Background_Header.jpg";

type HeaderProps = {
	userData: {
		avatar?: string;
		username?: string;
	};
};

const Header: React.FC = ({}) => {
	const { userData, setUserData, loading, error } = useContext(UserContext);
	
	return (
		<Box
			display="flex"
			flexDirection="column" // Empile verticalement
			alignItems="center"
			justifyContent="center"
			minHeight="60vh"
			sx={{
				backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${bgImage})`,
				backgroundSize: "cover",
				backgroundRepeat: "no-repeat",
				backgroundPosition: "center",
			}}
		>
			<Avatar className="h-32 w-32"> {/* Avatar agrandi */}
				<AvatarImage src={userData?.avatar ?? undefined} alt="User Avatar" />
				<AvatarFallback>U</AvatarFallback>
			</Avatar>

			<Typography variant="h4" component="h1" sx={{ mt: 2, color: "white" }}>
				Username: {userData?.username || "Guest"}
			</Typography>
		</Box>
	);
};

export default Header;

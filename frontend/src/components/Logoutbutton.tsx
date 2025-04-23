import React from "react";
import { Button } from "@mui/material";
import axios from "axios";

const LogoutButton: React.FC = () => {
  // cookies eraser
  const handleLogout = async () => {
    try {
      // Make a request to the server to clear the cookie
      await axios.post(
        `${process.env.REACT_APP_BACKEND_IP}/auth/logout`,
        {},
        { withCredentials: true }
      );

      // Go to the home page
      window.location.href = "/";
    } catch (error) {
      console.error("Error during logout:", error);
      alert("Failed to log out");
    }
  };

  return (
    <div className={"mainContainer"}>
      <div className={"inputContainer"}>
        <Button
          variant="contained"
          color="error" // button color red for error
          onClick={handleLogout}
        >
          Log Out
        </Button>
      </div>
    </div>
  );
};

export default LogoutButton;

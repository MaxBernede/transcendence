import React from "react";
import Button from "@mui/material/Button";
import axios from "axios";
import ButtonComponent from "../utils/ButtonCompo";

// Login will redirect to loginbackend to save in the front the user and jwt
const LoginButton = () => {
  const handleLogin = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_IP}/auth/`,
        {
          //Auth will call the getAuth
          withCredentials: true, // Include cookies (not necessary)
        }
      );
      //   console.log("Response:", response.data);
      window.location.href = response.data.url; // redirect toward the login
    } catch (error) {
      console.error("Error in the connexion :", error);
      alert("error in the connexion process");
    }
  };

  return (
    <div className={"mainContainer"}>
      <br />
      <ButtonComponent onClick={handleLogin}>Login with 42</ButtonComponent>
    </div>
  );
};

export default LoginButton;

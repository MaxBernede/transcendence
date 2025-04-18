// UserPage.tsx
import React, { useContext } from "react";
import { UserContext } from "../../App";
import EditableFieldButton from "../../utils/EditButton";
import axios from "axios";
import Remove2FAButton from "../../components/2FA/2FARemove";
import TwoFactorAuth from "../../components/2FA/2FA";
import { Box } from "@mui/material";
import Header from "../../utils/Mybox";
import ProfilePictureUpload from "../../utils/ProfilePicUp";
import AvatarUpdate from "./AvatarUpdate";

const UserPage: React.FC = () => {
  const { userData, setUserData, loading, error } = useContext(UserContext);

  const handleChange = async (field: string, value: string) => {
    if (userData?.id) {
      try {
        const token = localStorage.getItem("jwt"); // JWT token from localStorage
        const response = await axios.put(
          `${process.env.REACT_APP_BACKEND_IP}/api/users/${userData.id}`,
          { [field]: value },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // Dynamically update the field in userData
        setUserData({ ...userData, [field]: value });
        console.log(`${field} updated:`, response.data);
      } catch (err) {
        console.error(`Error updating ${field}`, err);
      }
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh" // This ensures the content is vertically centered
      padding="2rem"
    >
      <AvatarUpdate></AvatarUpdate>
      {/* <ProfilePictureUpload></ProfilePictureUpload> */}
      {/* Editable username */}
      <EditableFieldButton
        field="username"
        currentValue={userData?.username || ""}
        onSave={handleChange}
      />

      {userData?.secret_2fa ? (
        <h1>✅ 2FA Activated</h1>
      ) : (
        <h1>❌ 2FA not activated</h1>
      )}
      <Remove2FAButton></Remove2FAButton>
      {/* <Component></Component> */}
      <TwoFactorAuth></TwoFactorAuth>
    </Box>
  );
};

export default UserPage;

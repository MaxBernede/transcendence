import axios from "axios";
import { buildAvatarUrl } from "./UserUtils";

export const handleImageChange = async (
  e: React.ChangeEvent<HTMLInputElement>,
  userId: string,
  setUserData: React.Dispatch<React.SetStateAction<any>>
) => {
  const file = e.target.files?.[0];
  if (!file) return;

  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axios.post(
      `${process.env.REACT_APP_BACKEND_IP}/api/users/${userId}/upload-avatar`,
      formData,
      { withCredentials: true }
    );

    setUserData((prev: any) => ({
      ...prev!,
      avatar: buildAvatarUrl(response.data.avatar),
    }));
  } catch (error) {
    console.error("Error uploading avatar:", error);
  }
};

export const handleUpdateUser = async (
  newUsername: string,
  userId: string,
  setUserData: React.Dispatch<React.SetStateAction<any>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>,
  setEditing?: React.Dispatch<React.SetStateAction<boolean>>
) => {
  if (!newUsername.trim()) {
    setError("Username cannot be empty.");
    return;
  }

  try {
    const response = await axios.put(
      `${process.env.REACT_APP_BACKEND_IP}/api/users/${userId}`,
      { username: newUsername },
      { withCredentials: true }
    );

    setUserData((prev: any) => ({
      ...prev!,
      username: response.data.username,
    }));
    if (setEditing) setEditing(false);
  } catch (error) {
    console.error("Error updating user data:", error);
    setError("Failed to update user.");
  }
};

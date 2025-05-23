import axios from "axios";
import { buildAvatarUrl } from "./UserUtils";

export type UserData = {
  id: string;
  username: string;
  secret_2fa: string | null;
  avatar: string | null;
  wins: number;
  losses: number;
  ladderLevel: number;
  activity_status: boolean;
  matchHistory: any[]; // Add matchHistory here
  [key: string]: any; // Optional if there are other dynamic fields
};

export const fetchUserData = async (
  setUserData: React.Dispatch<React.SetStateAction<UserData | null>>,
  setMatchHistory: React.Dispatch<React.SetStateAction<any[]>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>
) => {
  try {
    const response = await axios.get(
      `${process.env.REACT_APP_BACKEND_IP}/api/users/me`,
      {
        withCredentials: true,
      }
    );
    // console.log(response);
    const user = response.data;
    // console.log("Fetched user data:", user);

    setUserData({
      ...user,
      avatar: user.avatar ? buildAvatarUrl(user.avatar) : user.image?.link,
      losses: user.losses || user.loose || 0,
    });

    setMatchHistory(user.matchHistory || []);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(
        "Error fetching userrr data:",
        error.response || error.message
      );
      setError(
        error.response?.data?.message ||
          "Failed to fetch user data. Please log in."
      );
    } else {
      console.error("An unexpected error occurred:", error);
      setError("An unexpected error occurred. Please try again.");
    }
  } finally {
    setLoading(false);
  }
};

export const updateUserUsername = async (
  newUsername: string,
  userId: string,
  setUserData: React.Dispatch<React.SetStateAction<UserData | null>>,
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

    setUserData((prev) => ({
      ...prev!,
      username: response.data.username,
    }));
    if (setEditing) setEditing(false);
  } catch (error) {
    setError("Failed to update user.");
  }
};

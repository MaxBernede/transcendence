import axios from "axios";

const defaultAvatar = "/assets/Bat.jpg";

export const buildAvatarUrl = (
  avatar: string | null,
  imageLink?: string | null
): string => {
  // Prioritize `imageLink` if available
  const url = imageLink || avatar || defaultAvatar;

  // If it's an external URL, return it as is
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  // If it already has a timestamp, return it
  if (url.includes("?t=")) {
    return url;
  }

  // Add a timestamp for local URLs to prevent caching
  return `${url}${url.includes("?") ? "&" : "?"}t=${new Date().getTime()}`;
};

export const updateUserAvatar = async (userId: string, file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axios.post(
    `${process.env.REACT_APP_BACKEND_IP}/api/users/${userId}/upload-avatar`,
    formData,
    { withCredentials: true }
  );

  return buildAvatarUrl(response.data.avatar);
};

export const updateUser = async (userId: string, username: string) => {
  if (!username.trim()) {
    throw new Error("Username cannot be empty.");
  }

  const response = await axios.put(
    `${process.env.REACT_APP_BACKEND_IP}/api/users/${userId}`,
    { username },
    { withCredentials: true }
  );

  return response.data.username;
};

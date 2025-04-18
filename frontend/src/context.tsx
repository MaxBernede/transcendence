import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { number, string, z } from "zod";
import axios from "axios";

export const userPayload = z.object({
  id: number(),
  username: string().nonempty(),
  avatar: string().optional(),
});

export type UserPayload = z.infer<typeof userPayload>;

export const UserContext = createContext<UserPayload | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserPayload | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
	    console.log("fetchUser");
      try {
        const { data } = await axios.get("http://localhost:3000/api/users/me", {
          withCredentials: true,
        });
        const validatedUser = userPayload.parse(data);
        setUser(validatedUser);
      } catch (error) {
        console.error("Failed to fetch user:", error);
        setUser(undefined);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
};

export function useUserContext() {
  const user = useContext(UserContext);

  if (!user) {
    throw new Error(
      "UserContext not provided. Make sure to wrap your component with UserProvider."
    );
  }

  return user;
}


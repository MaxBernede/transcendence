"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: number;
  username: string;
  avatarUrl: string;
};

const Dashboard = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true); // Show a loading state
  const [user, setUser] = useState<User | null>(null);

  // Fetch the user data when the component mounts
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("http://localhost:3000/users/me", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("jwt")}`,
          },
        });

        console.log(response);

        if (response.ok) {
          const userData = await response.json();
          setUser(userData); // Save user details to state
        } else {
          router.push("/auth/login"); // Redirect if not authenticated
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        router.push("/auth/login"); // Redirect on error
      } finally {
        setLoading(false); // Stop loading state
      }
    };

    fetchUser();
  }, [router]);

  // Logout function to clear JWT and redirect to login
  const logout = () => {
    localStorage.removeItem("jwt"); // Remove JWT from local storage
    router.push("/auth/login"); // Redirect to login page
  };

  // Loading state
  if (loading) {
    return <p>Loading...</p>;
  }

  // If user data isn't available, do not render
  if (!user) {
    return null;
  }

  return (
    <div>
      <h1>Welcome to the Dashboard</h1>
      <div>
        {/* Dynamically render each user field */}
        {Object.entries(user).map(([key, value]) => (
          <div key={key}>
            <strong>{key}:</strong>{" "}
            {typeof value === "string" || typeof value === "number"
              ? value
              : JSON.stringify(value)}
          </div>
        ))}
      </div>

      {/* Logout button */}
      <button
        onClick={logout}
        className="bg-red-500 text-white py-2 px-4 rounded mt-4"
      >
        Logout
      </button>
    </div>
  );
};

export default Dashboard;

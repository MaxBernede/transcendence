"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: number;
  username: string;
  avatarUrl: string;
};

type Friend = {
  friend_id: number;
  username: string;
};

const Dashboard = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user data
        const userResponse = await fetch("http://localhost:3000/users/me", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("jwt")}`,
          },
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData);
        } else {
          router.push("/auth/login");
        }

        // Fetch friends list
        // const friendsResponse = await fetch(
        //   "http://localhost:3000/users/me/friends",
        //   {
        //     method: "GET",
        //     headers: {
        //       Authorization: `Bearer ${localStorage.getItem("jwt")}`,
        //     },
        //   }
        // );

        // if (friendsResponse.ok) {
        //   const friendsData: Friend[] = await friendsResponse.json();
        //   setFriends(friendsData); // Set friends data
        // } else {
        //   setError("Failed to load friends list.");
        // }
      } catch (error) {
        setError("Failed to load data.");
      } finally {
        setLoading(false);
        // setFriendsLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const logout = () => {
    localStorage.removeItem("jwt");
    router.push("/auth/login");
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return null;
  }

  return (
    <div>
      <h1>Welcome to the Dashboard</h1>
      <div>
        {Object.entries(user).map(([key, value]) => (
          <div key={key}>
            <strong>{key}:</strong>{" "}
            {key === "avatarUrl" ? (
              <img
                src={value as string}
                alt="User Avatar"
                className="w-16 h-16 rounded-full"
              />
            ) : typeof value === "string" || typeof value === "number" ? (
              value
            ) : (
              JSON.stringify(value)
            )}
          </div>
        ))}
      </div>

      <div>
        <h2>Your Friends</h2>
        {friendsLoading ? (
          <p>Loading friends...</p>
        ) : error ? (
          <p>Error loading friends: {error}</p>
        ) : friends.length === 0 ? (
          <p>You have no friends yet.</p>
        ) : (
          <ul>
            {friends.map((friend) => (
              <li key={friend.friend_id}>
                <div>
                  <h3>Friend Name: {friend.username}</h3>
                </div>
                {/* Optionally, you can add an avatar or an action button like 'remove friend' */}
              </li>
            ))}
          </ul>
        )}
      </div>

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

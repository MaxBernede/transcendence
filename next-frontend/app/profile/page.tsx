// app/user/[id]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button"; // ShadCN Button
import { Input } from "@/components/ui/input"; // ShadCN Input
import { Header } from "@/components/Header"; // Custom Header component
import { Stats } from "@/components/Stats"; // Custom Stats component
import { MatchHistory } from "@/components/MatchHistory"; // Custom MatchHistory component

const defaultAvatar = "/assets/Bat.jpg";

type UserData = {
  id: string;
  username: string;
  avatar: string | null;
  image?: { link?: string };
  [key: string]: any;
};

const buildAvatarUrl = (
  avatar: string | null,
  imageLink?: string | null
): string => {
  const url = imageLink || avatar || defaultAvatar;

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  if (url.includes("?t=")) {
    return url;
  }

  return `${url}${url.includes("?") ? "&" : "?"}t=${new Date().getTime()}`;
};

const UserPage = ({ params }: { params: { id: string } }) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [newUsername, setNewUsername] = useState<string>("");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/users/me`, {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch user data");
        }

        const data = await response.json();
        setUserData({
          ...data,
          avatar: buildAvatarUrl(data.avatar, data.image?.link),
          losses: data.losses || 0,
          ladderLevel: data.ladderLevel || 0,
          matchHistory: data.matchHistory || [],
          achievements: data.achievements || [],
        });
      } catch (error) {
        setError("Failed to fetch user data");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [params.id]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `http://localhost:3000/api/users/${userData?.id}/upload-avatar`,
        {
          method: "POST",
          body: formData,
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Error uploading avatar");
      }

      const result = await response.json();
      setUserData((prevData) => ({
        ...prevData!,
        avatar: buildAvatarUrl(result.avatar),
      }));
    } catch (error) {
      console.error("Error uploading avatar:", error);
    }
  };

  const handleUpdateUser = async () => {
    if (!newUsername.trim()) {
      alert("Username cannot be empty.");
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/users/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: newUsername }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to update user");
      }

      const updatedUser = await response.json();
      setUserData((prevData) => ({
        ...prevData!,
        username: updatedUser.username,
      }));
      setEditing(false);
    } catch (error) {
      alert("Failed to update user.");
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="user-page-container space-y-8">
      <Header
        id={userData?.id || ""}
        username={userData?.username || ""}
        avatar={buildAvatarUrl(
          userData?.avatar ?? null,
          userData?.image?.link ?? null
        )}
        handleImageChange={handleImageChange}
      />
      <div className="content-container">
        {editing ? (
          <div className="edit-user-container space-y-4">
            <Input
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="Enter new username"
            />
            <div className="space-x-4">
              <Button onClick={handleUpdateUser}>Save</Button>
              <Button variant="outline" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="user-info flex items-center space-x-4">
            <h2 className="text-xl">{userData?.username}</h2>
            <Button variant="outline" onClick={() => setEditing(true)}>
              Edit Username
            </Button>
          </div>
        )}

        <Stats
          wins={userData?.wins || 0}
          losses={userData?.losses || 0}
          ladderLevel={userData?.ladderLevel || 0}
          achievements={userData?.achievements}
        />
        <MatchHistory matchHistory={userData?.matchHistory} />
      </div>
    </div>
  );
};

export default UserPage;

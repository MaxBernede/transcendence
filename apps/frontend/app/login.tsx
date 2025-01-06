"use client";

import { useState } from "react";
import { trpc } from "./lib/trpc";

export default function Login() {
  const {
    data: user,
    isLoading,
    error,
  } = trpc.users.getUserById.useQuery(
    { id: "1" },
    {
      retry: false, // Disable retries
    }
  );

  if (isLoading) return <div>Loading...</div>;

  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>User Information</h1>
      <p>
        <strong>ID:</strong> {user?.id}
      </p>
      <p>
        <strong>Username:</strong> {user?.username}
      </p>
    </div>
  );
}

"use client";

import * as React from "react";
import { Button } from "@/components/ui/button"; // ShadCN Button
export function LoginButton() {
  const handleLogin = async () => {
    try {
      const response = await fetch("http://localhost:3000/auth/", {
        method: "GET",
        credentials: "include", // Include cookies if needed
      });

      if (!response.ok) {
        throw new Error("Failed to start login process");
      }

      console.log(response);

      const data = await response.json();
      window.location.href = data.url; // Redirect the user to the 42 login page
    } catch (error) {
      console.error("Error during login:", error);
      alert("Failed to start login process");
    }
  };

  return (
    <Button variant="outline" onClick={handleLogin}>
      Log in with 42
    </Button>
  );
}

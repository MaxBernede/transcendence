// app/signup/page.tsx
'use client'

import { useState } from "react";
import { useRouter } from "next/navigation";

const SignupPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset error state
    setError("");

    // Prepare data for submission
    const userData = {
      username,
      password,
    };

    try {
      // Send POST request to the backend to register the user
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        // Save JWT token to localStorage
        localStorage.setItem("auth_token", data.token); // Assuming the backend returns the token as "token"
        
        // Redirect the user to the home page or dashboard
        router.push("/dashboard"); // Change this to where you want to redirect
      } else {
        // Handle errors
        setError(data.message || "Something went wrong");
      }
    } catch (error) {
      console.error("Error during signup:", error);
      setError("An error occurred. Please try again.");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "0 auto", padding: "20px" }}>
      <h1>Sign Up</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Sign Up</button>
      </form>
      
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default SignupPage;

'use client'; // Mark this file as a client-side component

import React, { useState } from 'react';
import Link from 'next/link';

const SignUp = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null); // to store error messages
  const [loading, setLoading] = useState(false); // to track loading state

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs (optional, can be improved with better validation)
    if (!username || !password) {
      setError('Please provide both username and password');
      return;
    }

    setLoading(true); // Start loading

    try {
      // Send the POST request to your API
      const response = await fetch('http://localhost:3000/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      // Check if the response is OK (status code 200-299)
      if (response.ok) {
        const data = await response.json();
        console.log('User created:', data); // Handle successful response, e.g., redirect or show success
        // Optionally redirect the user to the login page
        window.location.href = '/signin'; // Or use next/router for client-side routing
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'An error occurred during sign up');
      }
    } catch (error) {
      console.error('Error signing up:', error);
      setError('Failed to connect to the server.');
    } finally {
      setLoading(false); // End loading
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
        {/* Logo or Title */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-foreground">Create an Account</h2>
          <p className="text-gray-500 dark:text-gray-300">Sign up to get started</p>
        </div>

        {/* Sign-up Form */}
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Username input */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-foreground">
              Username
            </label>
            <input
              id="username"
              type="text"
              name="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Enter your username"
            />
          </div>

          {/* Password input */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground">
              Password
            </label>
            <input
              id="password"
              type="password"
              name="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Enter your password"
            />
          </div>

          {/* Error message */}
          {error && <div className="text-red-500 text-sm">{error}</div>}

          {/* Submit button */}
          <div>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              {loading ? 'Signing up...' : 'Sign up'}
            </button>
          </div>
        </form>

        {/* Alternative login option */}
        <div className="text-center mt-4 text-sm text-gray-500 dark:text-gray-300">
          <p>
            Already have an account?{' '}
            <Link href="/login" className="text-blue-500 hover:text-blue-700">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;

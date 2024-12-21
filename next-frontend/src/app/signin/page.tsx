// pages/login.tsx

import React from 'react';
import Link from 'next/link';

const Login = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
        {/* Logo or Title */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-foreground">Welcome Back!</h2>
          <p className="text-gray-500 dark:text-gray-300">Please log in to your account</p>
        </div>

        {/* Login Form */}
        <form className="space-y-6">
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
              className="mt-1 block w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Enter your password"
            />
          </div>

          {/* Submit button for manual login */}
          <div>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Log in
            </button>
          </div>
        </form>

        {/* Intra 42 Login */}
        <div className="text-center mt-4">
          <button
            type="button"
            className="w-full bg-green-500 text-white p-3 rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Log in with Intra 42
          </button>
        </div>

        {/* Alternative login option */}
        <div className="text-center mt-4 text-sm text-gray-500 dark:text-gray-300">
          <p>
            Don't have an account?{' '}
            <Link href="/signup" className="text-blue-500 hover:text-blue-700">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

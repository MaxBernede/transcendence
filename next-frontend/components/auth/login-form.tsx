"use client";
import React from "react";

import CardWrapper from "./card-wrapper";

import { useTheme } from "next-themes";

import Link from "next/link";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { LoginSchema } from "@/schema";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { z } from "zod";

import { useState } from "react";

import { useRouter } from "next/navigation"; // Correct import

const LoginForm = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null); // Add error state

  const form = useForm({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof LoginSchema>) => {
    setLoading(true); // Start loading state
    // setError(null); // Reset error state

    try {
      // Send POST request to backend
      console.log("awaiting fetch");
      const response = await fetch("http://localhost:3000/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: data.username,
          password: data.password,
        }),
      });

      console.log(response);

      if (!response.ok) {
        // Handle backend errors (e.g., invalid credentials)
        const errorData = await response.json();

        // Check if it's a 401 Unauthorized error
        if (response.status === 401) {
          // For 401 Unauthorized error, just show the message and don't throw
          setError(
            "Invalid credentials. Please check your username and password."
          );
        } else {
          // For other errors, show the message and throw
          setError(errorData.message || "An error occurred");
        }

        return; // No need to proceed further if error is encountered
      } else {
        setError(null); // Reset error state
      }

      // If successful, extract JWT from the response
      const responseData = await response.json();
      const jwt = responseData.access_token;

      // Store JWT in local storage or context (depending on your needs)
      localStorage.setItem("jwt", jwt);

      // Optionally, redirect to another page (e.g., a dashboard)
      router.push("/dashboard");

      console.log("JWT received:", jwt);

      // Reset form or show success message if necessary
    } catch (error) {
      console.error("Error during authentication:", error);
      // Display error message to the user (you can show a Toast or update state)
    } finally {
      setLoading(false); // End loading state
    }
    console.log("done");
  };

  return (
    <CardWrapper
      label="Login to your account"
      title="Login"
      backButtonHref="/auth/signup"
      backButtonLabel="Sign In"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="username">Username</FormLabel>
                  <FormControl>
                    <Input {...field} type="username" placeholder="username" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="password">Password</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" placeholder="password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Show error message if there's an error */}
          {error && (
            <div className="text-red-500 text-sm mt-2">
              {error} {/* This will display the error message */}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Loading..." : "Login"}
          </Button>

          {/* redirect to sign in page */}
          <div className="mt-4 text-center justify-center w-full">
            <p className="text-sm">
              Don't have an account?{" "}
              <Link
                href="/auth/signup"
                className="text-blue-500 hover:underline"
              >
                Sign Up
              </Link>
            </p>
          </div>

          {/* Horizontal line with "or" in the center */}
          <div className="flex items-center my-4">
            <div className="flex-grow border-t border-foreground"></div>
            <span className="mx-4 text-foreground">or</span>
            <div className="flex-grow border-t border-foreground"></div>
          </div>

          {/* continue with 42 */}
          <div className="flex justify-center mt-4">
            <Button
              className="flex items-center space-x-2 px-4 py-2 bg-foreground text-background rounded-md hover-bg-primary"
              onClick={() => alert("TODO: call 42 API")}
            >
              <img
                src="/42-logo.svg"
                alt="My Logo"
                className={`w-5 h-5 filter ${theme === "dark" ? "invert" : ""}`} // Correctly apply 'invert' if the theme is dark
              />
              <span>Continue with 42</span>
            </Button>
          </div>
        </form>
      </Form>
    </CardWrapper>
  );
};

export default LoginForm;

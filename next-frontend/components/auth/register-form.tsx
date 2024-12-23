"use client";
import React from "react";
// ("use client");

import CardWrapper from "./card-wrapper";

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
import { RegisterSchema } from "@/schema";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { z } from "zod";

import { useFormStatus } from "react-dom";
import { useState } from "react";
import { useRouter } from "next/navigation"; // Correct import

const RegisterForm = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null); // Add error state

  const form = useForm({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof RegisterSchema>) => {
    setLoading(true); // Start loading state

    try {
      // Send POST request to backend
      console.log("awaiting fetch");
      const response = await fetch("http://localhost:3000/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        //TODO: also handle confirmPassword in the backend
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
          setError("The username is already taken");
        } else {
          // For other errors, show the message and throw
          setError(errorData.message || "An error occurred");
        }

        return; // No need to proceed further if error is encountered
      } else {
        setError(null); // Reset error state
      }

      // If successful, extract JWT from the response
      // Optionally, redirect to another page (e.g., a dashboard)
      if (response.status === 201) {
        router.push("/auth/login");
      } else {
        setError("An error occurred");
      }

      // Reset form or show success message if necessary
    } catch (error) {
      console.error("Error during authentication:", error);
      // Display error message to the user (you can show a Toast or update state)
    } finally {
      setLoading(false); // End loading state
    }

    // console.log(data);
    console.log("awaiting fetch");
  };

  return (
    <CardWrapper
      label="Create an account"
      title="Signup"
      backButtonHref="/auth/signin"
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
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="confirmPassword">
                    Confirm Password
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      placeholder="confirm passowrd"
                    />
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
            {loading ? "Loading..." : "Sign Up"}
          </Button>

          {/* redirect to sign in page */}
          <div className="mt-4 text-center justify-center w-full">
            <p className="text-sm">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="text-blue-500 hover:underline"
              >
                Login
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
                className="w-5 h-5 filter invert"
              />
              <span>Continue with 42</span>
            </Button>
          </div>
        </form>
      </Form>
    </CardWrapper>
  );
};

export default RegisterForm;

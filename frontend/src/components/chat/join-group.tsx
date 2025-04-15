import React from "react";
import axios from "axios";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "../ui/form";

import { z } from "zod";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

const joinGroupSchema = z.object({
  id: z
    .string()
    .min(1, "Username cannot be empty")
    .nonempty("At least one participant is required"),
  password: z.string().optional(),
});

type NewGroup = z.infer<typeof joinGroupSchema>;

export const JoinGroup = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const navigate = useNavigate();

  const form = useForm({
    resolver: zodResolver(joinGroupSchema),
    defaultValues: {
      id: "",
      password: "",
    },
  });

  const customSubmit = async () => {
    const formData = form.getValues();

    console.log("Custom form submitted", formData);

    const joinGroupDto: NewGroup = {
      id: formData.id,
	  password: formData.password,
    };

    console.log("joining:", joinGroupDto.id);

    try {
      setLoading(true); // Set loading state to true
      const { data } = await axios.post(
        "http://localhost:3000/conversations/join-conversation",
        { id: joinGroupDto.id, password: joinGroupDto.password },
        { withCredentials: true }
      );
      console.log("Navigating to chat page...");
      navigate(`/chat/${data.conversationId}`); // React Router navigation
      setIsOpen(false); // Close the dialog only on success
      setError(null);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.log("Failed to join group:", error.response?.data);
        setError(error.response?.data.message); // Show error
      } else {
        console.error("Failed to join group:", error);
        setError("Failed to join group"); // Show error message
      }

      setIsOpen(true);
      setLoading(false); // Reset loading state
      // Dialog stays open even on error
    }
  };

  const handleOpenDialog = () => {
    setIsOpen(true);
    form.reset(); // Reset form values when opening dialog
    setError(null); // Clear any error messages
    setLoading(false); // Ensure the button is not disabled
  };

  const handleCloseDialog = () => {
    form.reset();
    setIsOpen(false);
    setError(null);
  };

  // Submit on Enter press and prevent default page reload
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      e.preventDefault();
      customSubmit();
    }
    if (e.key === "Escape") {
      handleCloseDialog();
    }
  };

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogTrigger asChild>
        <Button 
          className="flex-1 bg-blue-900/30 backdrop-blur-sm rounded-lg shadow-lg hover:bg-blue-800/40 transition-colors border-0"
          onClick={handleOpenDialog}
        >
          Join Group
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader className="flex flex-col items-center">
          <AlertDialogTitle>Join Group</AlertDialogTitle>
        </AlertDialogHeader>

        <Form {...form}>
          <form onKeyDown={handleKeyPress}>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="id"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        {...field}
                        type="groupId"
                        placeholder="abcd1234-ab12-cd34-ef56-gh789012ijkl"
                      />
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
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="password (optional)"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {error && <div className="text-red-500 text-sm mt-2">{error}</div>}

            <AlertDialogFooter className="flex justify-between space-x-4 mt-4">
              <AlertDialogCancel asChild>
                <Button
                  className="bg-red-600 border-none w-full"
                  onClick={handleCloseDialog} // Ensure dialog is closed
                >
                  Cancel
                </Button>
              </AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button
                  type="button"
                  className="bg-green-600 border-none w-full disabled:bg-gray-400 disabled:cursor-not-allowed"
                  disabled={loading}
                  onClick={customSubmit}
                >
                  Join Group
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  );
};

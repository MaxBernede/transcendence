import React from "react";
import axios from "axios"; // Import Axios
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
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

import { set, z } from "zod";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

const newGroupSchema = z.object({
  username: z
    .string()
    .regex(/^[a-zA-Z0-9-]+$/, "Username must be alphanumeric")
    .min(1, "Username cannot be empty")
    .nonempty("At least one participant is required"),
});

type NewGroup = z.infer<typeof newGroupSchema>;

export const CreateNewDm = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const navigate = useNavigate();

  const form = useForm({
    resolver: zodResolver(newGroupSchema),
    defaultValues: {
      username: "",
    },
  });

  const customSubmit = async () => {
    const formData = form.getValues();

    console.log("Custom form submitted", formData);

    const newDmConversation = {
      type: "DM",
      participants: [formData.username],
    };

    console.log("New DM Conversation:", newDmConversation);

    try {
      setLoading(true);
      const { data } = await axios.post(
        `${process.env.REACT_APP_BACKEND_IP}/conversations`,
        newDmConversation,
        {
          withCredentials: true,
        }
      );
      console.log("Created dm:", data);
      console.log("Navigating to chat page...");
      navigate(`/chat/${data.id}`);
      setIsOpen(false);
      setError(null);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.log("Failed to join group:", error.response?.data);
        setError(error.response?.data.message);
      } else {
        console.error("Failed to join group:", error);
        setError("Failed to create dm");
      }
      setIsOpen(true);
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setIsOpen(true);
    form.reset();
    setError(null);
    setLoading(false);
  };

  const handleCloseDialog = () => {
    setError(null);
    setIsOpen(false);
    form.reset();
  };
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      e.preventDefault();
      customSubmit();
    }
    if (e.key === "Escape") {
      console.log("Escape key pressed");
      setError(null);
      setIsOpen(false);
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
          Create New DM
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent onKeyDown={handleKeyPress} tabIndex={0}>
        <AlertDialogHeader className="flex flex-col items-center">
          <AlertDialogTitle>Create a New DM</AlertDialogTitle>
        </AlertDialogHeader>

        <Form {...form}>
          <form>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        {...field}
                        type="username"
                        placeholder="username"
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
                  onClick={handleCloseDialog}
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
                  Create DM
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  );
};

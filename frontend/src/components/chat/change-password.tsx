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

import { set, z } from "zod";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

const newPasswordSchema = z.object({
  password: z
    .string()
    .regex(/^[a-zA-Z0-9]*$/, "Password must be alphanumeric")
    .min(0, "Password cannot be negative")
    .optional()
    .transform(val => val || ""),
});

type NewPassword = z.infer<typeof newPasswordSchema>;

interface ChangePasswordProps {
  onClose: () => void;
  conversationId: string;
}

export const ChangePassword: React.FC<ChangePasswordProps> = ({ onClose, conversationId }) => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  const form = useForm<NewPassword>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: {
      password: "",
    },
  });

  const customSubmit = async () => {
    const formData = form.getValues();

    console.log("Custom form submitted", formData);

    const newPassword = {
      id: conversationId,
      password: formData.password,
    };

    console.log("New Password:", newPassword);

    try {
      setLoading(true);
      const { data } = await axios.post(
        "http://localhost:3000/conversations/change-password",
        newPassword,
        {
          withCredentials: true,
        }
      );
      console.log("Changed password:", data);
      onClose();
      setError(null);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.log("Failed to change password:", error.response?.data);
        setError(error.response?.data.message);
      } else {
        console.error("Failed to change password:", error);
        setError("Failed to change password");
      }
      setLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setError(null);
    setIsOpen(false);
    form.reset();
    onClose();
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
      <AlertDialogContent onKeyDown={handleKeyPress} tabIndex={0}>
        <AlertDialogHeader className="flex flex-col items-center">
          <AlertDialogTitle>Change Group Password</AlertDialogTitle>
        </AlertDialogHeader>

        <Form {...form}>
          <form>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="New password"
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
                  Change Password
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  );
};

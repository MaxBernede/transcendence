import React, { useState } from "react";
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
} from "../ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { PublicUserInfo } from "./types";

// Updated validation schema for the mute feature
const muteSchema = z.object({
  id: z.number().min(1, "User ID must be a number"),
  conversationId: z.string().min(1, "Conversation ID cannot be empty"),
  reason: z.string().optional(),
  minutes: z.number().min(0),
  hours: z.number().min(0),
  days: z.number().min(0),
});

type MuteData = z.infer<typeof muteSchema>;

interface MuteSelectorProps {
  targetUser: PublicUserInfo;
  conversationId: string;
  onClose: () => void; // Callback to close the component
}

export const MuteSelector: React.FC<MuteSelectorProps> = ({
  targetUser,
  conversationId,
  onClose,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(muteSchema),
    defaultValues: {
      id: targetUser.id,
      conversationId: conversationId,
      reason: "",
      minutes: 0,
      hours: 0,
      days: 0,
    },
  });

  const customSubmit = async () => {
    const formData = form.getValues();

    // z.date()
    try {
      setLoading(true);
      const { data } = await axios.post(
        "http://localhost:3000/conversations/mute-user",
        formData,
        { withCredentials: true }
      );
      console.log("User muted:", data);
      setError(null);
      setLoading(false);
      onClose();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setError(error.response?.data.message || "Failed to mute user");
      } else {
        setError("An error occurred");
      }
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={true}>
      <AlertDialogContent>
        <AlertDialogHeader className="flex flex-col items-center">
          <AlertDialogTitle>Mute {targetUser.username}</AlertDialogTitle>
        </AlertDialogHeader>

        <Form {...form}>
          <form>
            <div className="space-y-4">
              {/* Reason Input */}
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="reason">
                      Reason for mute (optional)
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Reason (optional)" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Duration Breakdown (Minutes, Hours, Days) */}
              <div className="grid grid-cols-3 gap-4 w-full">
                {/* Minutes */}
                <FormField
                  control={form.control}
                  name="minutes"
                  render={({ field }) => (
                    <FormItem className="flex flex-col items-center">
                      <FormLabel className="text-center">Minutes</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min="0"
                          placeholder="0"
                          className="w-full text-center"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Hours */}
                <FormField
                  control={form.control}
                  name="hours"
                  render={({ field }) => (
                    <FormItem className="flex flex-col items-center">
                      <FormLabel className="text-center">Hours</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min="0"
                          placeholder="0"
                          className="w-full text-center"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Days */}
                <FormField
                  control={form.control}
                  name="days"
                  render={({ field }) => (
                    <FormItem className="flex flex-col items-center">
                      <FormLabel className="text-center ">Days</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min="0"
                          placeholder="0"
                          className="w-full text-center"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {/* Helper Text */}
              <p className="text-sm text-gray-500 text-center mt-2">
                Leaving all values at <strong>0</strong> will make the mute
                permanent.
              </p>
            </div>

            {error && <div className="text-red-500 text-sm mt-2">{error}</div>}

            <AlertDialogFooter className="flex justify-between space-x-4 mt-4">
              <AlertDialogCancel asChild>
                <Button
                  className="bg-red-600 border-none w-full"
                  onClick={onClose} // Close the dialog when Cancel is clicked
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
                  Mute User
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  );
};

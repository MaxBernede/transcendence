import React from "react";
import axios from "axios";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Plus, X } from "lucide-react";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
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
  FormLabel,
  FormMessage,
} from "../ui/form";

import { z } from "zod";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Router } from "react-router-dom";
import { useNavigate } from "react-router-dom";

const newGroupSchema = z.object({
  groupName: z.string().optional(),
  password: z.string().optional(),
  participants: z
    .string()
    .regex(/^[a-zA-Z0-9]+$/, "Username must be alphanumeric")
    .min(1, "Username cannot be empty")
    .nonempty("At least one participant is required"),
});

type NewGroup = z.infer<typeof newGroupSchema>;

export const CreateNewGroup = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [participants, setParticipants] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const navigate = useNavigate();

  const form = useForm({
    resolver: zodResolver(newGroupSchema),
    defaultValues: {
      groupName: "",
      password: "",
      participants: "",
    },
  });

  const addParticipant = (participant: string) => {
    if (participant) {
      if (participants.includes(participant)) {
        setError("This participant is already added.");
      } else if (participants.length < 8) {
        const updatedParticipants = [...participants, participant];
        setParticipants(updatedParticipants);
        form.setValue("participants", "");
        setError(null);
      } else {
        setError("You can only add up to 8 participants.");
      }
    }
  };

  const removeParticipant = (participant: string) => {
    const updatedParticipants = participants.filter((p) => p !== participant);
    setParticipants(updatedParticipants);
    setError(null);
  };

  const customSubmit = async () => {
    const formData = form.getValues();
    // console.log("Custom form submitted", data);
    // console.log("Participants:", participants);

    const newGroupConversation = {
      type: "GROUP",
      name: formData.groupName,
      password: formData.password,
      participants: participants,
    };

    console.log("New Group Conversation:", newGroupConversation);

    try {
      const { data } = await axios.post(
        "http://localhost:3000/conversations",
        newGroupConversation,
        {
          withCredentials: true,
        }
      );
      console.log("Created group:", data);
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
    form.reset();
    setIsOpen(false);
    setError(null);
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
        <Button className="bg-cyan-700" onClick={handleOpenDialog}>
          Create New Group
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent onKeyDown={handleKeyPress} tabIndex={0}>
        <AlertDialogHeader className="flex flex-col items-center">
          <AlertDialogTitle>Create a New Group</AlertDialogTitle>
        </AlertDialogHeader>

        <Form {...form}>
          <form>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="groupName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="groupname">Group name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="groupname"
                        placeholder="groupname"
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
                    <FormLabel htmlFor="password">
                      Password (optional)
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="participants"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="participants">Participants</FormLabel>
                    <FormControl>
                      <div className="flex items-center space-x-2">
                        <Input
                          {...field}
                          type="text"
                          placeholder="Enter participant"
                          onChange={(e) => field.onChange(e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          className="bg-green-600"
                          onClick={async () => {
                            const isValid = await form.trigger("participants");
                            if (isValid) {
                              addParticipant(field.value);
                              field.onChange("");
                            }
                          }}
                          disabled={!field.value}
                        >
                          <Plus />
                        </Button>
                      </div>
                    </FormControl>

                    {form.formState.errors.participants && (
                      <FormMessage className="text-red-500">
                        {form.formState.errors.participants.message}
                      </FormMessage>
                    )}
                  </FormItem>
                )}
              />
            </div>
            {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
            <div className="mt-4">
              <ul>
                {participants.map((participant, index) => (
                  <li key={index} className="flex justify-between items-center">
                    <span>{participant}</span>
                    <Button
                      type="button"
                      className="text-red-500"
                      onClick={() => removeParticipant(participant)}
                    >
                      <X />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>

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
                  Create Group
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  );
};

import React from "react";
import axios from "axios"; // Import Axios
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
// import CardWrapper from "../ui/card-wrapper";
import { Plus, X } from "lucide-react";
import { AlertCircle } from "lucide-react";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { useUserContext } from "../../context";

import { set, z } from "zod";
import { green } from "@mui/material/colors";
import { group } from "console";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Router } from "react-router-dom";
import { useNavigate } from "react-router-dom";

const newGroupSchema = z.object({
  groupName: z.string().optional(),
  participants: z
    .string()
    .regex(/^[a-zA-Z0-9]+$/, "Username must be alphanumeric")
    .min(1, "Username cannot be empty")
    .nonempty("At least one participant is required"),
});

type NewGroup = z.infer<typeof newGroupSchema>;

export const JoinGroup = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [participants, setParticipants] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const navigate = useNavigate();

  const form = useForm({
    resolver: zodResolver(newGroupSchema),
    defaultValues: {
      groupName: "",
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
    setError(null); // Clear any previous error
  };

  const customSubmit = async () => {
    const formData = form.getValues();
    // console.log("Custom form submitted", data);
    // console.log("Participants:", participants);

    const newGroupConversation = {
      type: "GROUP",
      name: formData.groupName,
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
      navigate(`/chat/${data.id}`); // React Router navigation
    } catch (error) {
      console.error("Failed to create group:", error);
      setError("Failed to create group");
    }
  };

  const handleCloseDialog = () => {
    form.reset();
    setParticipants([]);
    setIsOpen(false);
    setError(null);
  };

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleCloseDialog();
      }}
    >
      <AlertDialogTrigger asChild>
        <Button className="bg-cyan-700" onClick={() => setIsOpen(true)}>
          Join Group
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader className="flex flex-col items-center">
          <AlertDialogTitle>Join Group</AlertDialogTitle>
        </AlertDialogHeader>

        <Form {...form}>
          <form>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="groupName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="groupname">Group ID</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="groupid"
                        placeholder="group id"
                      />
                    </FormControl>
                    <FormMessage />
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
                <Button className="bg-red-600 border-none w-full">
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


import React from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

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

interface CreateNewGroupProps {
  currentUserId: string;
  onCreateGroup: (username: string) => void;
}

export const CreateNewDm = () => {
  const [username, setUsername] = React.useState("");

  const handleSubmit = () => {
    if (username.trim() === "") {
      alert("Username cannot be empty!"); // Replace with better validation if needed
      return;
    }
    // onCreateGroup(username);
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button className="bg-cyan-700">Create New DM</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader className="flex flex-col items-center">
          <AlertDialogTitle>Create a New DM</AlertDialogTitle>
        </AlertDialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <div className="space-y-4">
            <div className="form-group">
              <Label />
              <Input
                id="username"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>
          <AlertDialogFooter className="flex justify-between space-x-4 mt-4">
            <AlertDialogCancel asChild>
              <Button className="bg-red-600 border-none w-full">Cancel</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                type="submit"
                className="bg-green-600 border-none w-full disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={!username.trim()}
              >
                Create DM
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
};

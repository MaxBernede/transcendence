// import React from "react";
// import { Button } from "../ui/button";
// import { Input } from "../ui/input";
// import { Label } from "../ui/label";

// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
//   AlertDialogTrigger,
// } from "../ui/alert-dialog";

// interface CreateNewGroupProps {
//   currentUserId: string;
//   onCreateGroup: (username: string) => void;
// }

// export const CreateNewDm = () => {
//   const [username, setUsername] = React.useState("");

//   const handleSubmit = () => {
//     if (username.trim() === "") {
//       alert("Username cannot be empty!"); // Replace with better validation if needed
//       return;
//     }
//     // onCreateGroup(username);
//   };

//   return (
//     <AlertDialog>
//       <AlertDialogTrigger asChild>
//         <Button className="bg-cyan-700">Create New DM</Button>
//       </AlertDialogTrigger>
//       <AlertDialogContent>
//         <AlertDialogHeader className="flex flex-col items-center">
//           <AlertDialogTitle>Create a New DM</AlertDialogTitle>
//         </AlertDialogHeader>
//         <form
//           onSubmit={(e) => {
//             e.preventDefault();
//             handleSubmit();
//           }}
//         >
//           <div className="space-y-4">
//             <div className="form-group">
//               <Label />
//               <Input
//                 id="username"
//                 placeholder="Enter username"
//                 value={username}
//                 onChange={(e) => setUsername(e.target.value)}
//                 required
//               />
//             </div>
//           </div>
//           <AlertDialogFooter className="flex justify-between space-x-4 mt-4">
//             <AlertDialogCancel asChild>
//               <Button className="bg-red-600 border-none w-full">Cancel</Button>
//             </AlertDialogCancel>
//             <AlertDialogAction asChild>
//               <Button
//                 type="submit"
//                 className="bg-green-600 border-none w-full disabled:bg-gray-400 disabled:cursor-not-allowed"
//                 disabled={!username.trim()}
//               >
//                 Create DM
//               </Button>
//             </AlertDialogAction>
//           </AlertDialogFooter>
//         </form>
//       </AlertDialogContent>
//     </AlertDialog>
//   );
// };

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

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Router } from "react-router-dom";
import { useNavigate } from "react-router-dom";

const newGroupSchema = z.object({
  username: z
    .string()
    .regex(/^[a-zA-Z0-9]+$/, "Username must be alphanumeric")
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
      setLoading(true); // Set loading state to true
      const { data } = await axios.post(
        "http://localhost:3000/conversations",
        newDmConversation,
        {
          withCredentials: true,
        }
      );
      console.log("Created dm:", data);
      console.log("Navigating to chat page...");
      navigate(`/chat/${data.id}`); // React Router navigation
      setIsOpen(false); // Close the dialog only on success
      setError(null);
    } catch (error) {
      console.error("Failed to create dm:", error);
      setError("Failed to create dm"); // Show error message
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
        <Button className="bg-cyan-700" onClick={handleOpenDialog}>
          Create New DM
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader className="flex flex-col items-center">
          <AlertDialogTitle>Create a New DM</AlertDialogTitle>
        </AlertDialogHeader>

        <Form {...form}>
          <form onKeyDown={handleKeyPress}>
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

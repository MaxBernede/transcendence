import React, { useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useOutletContext,
} from "react-router-dom"; // Added useNavigate for redirection
import { Avatar, AvatarImage } from "../ui/avatar";
import { Card, CardContent, CardTitle } from "../ui/card";
import { toast } from "sonner";

// import { tryCatch } from "@clevali/trycatch";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "../ui/context-menu";
import axios, { Axios } from "axios";
import LoginButton from "../Loginbutton";
import { CreateNewDm } from "./create-new-dm";
import { CreateNewGroup } from "./create-new-groupp";

import { Users } from "lucide-react";
import EventsHandler from "../../events/EventsHandler";

import { z } from "zod";
//TODO: fix this shit, monorepo?
import {
  EventsType,
  RemoveConversationFromListSchema,
  AddConversationToListSchema,
  GroupUserStatusUpdateSchema,
  GroupUserStatusAction,
} from "../../common/types/event-type";
import { UserPayload, useUserContext } from "../../context";
import { Socket } from "socket.io-client";

interface ChatContext {
  socket: Socket | null;
  me: UserPayload; // Adjust the type based on your actual user data
}

const ConversationList = () => {
  const location = useLocation(); // Get the current location (URL)
  const history = useNavigate(); // Used for redirection
  const [conversations, setConversations] = useState<any[]>([]);
  const [isUnauthorized, setIsUnauthorized] = useState(false); // State to handle unauthorized
  const [error, setError] = useState<string | null>(null);
  const me: UserPayload = useUserContext();
  //   const { socket, me } = useOutletContext<ChatContext>();
  // const { socket }: { socket: Socket | null } = useOutletContext();

  const removeConversation = (conversationId: string) => {
    setConversations((prevConversations) => {
      return prevConversations.filter(
        (conversation) => conversation.conversationId !== conversationId
      );
    });
  };

  const addConversation = (conversation: any) => {
    setConversations((prevConversations) => {
      return [...prevConversations, conversation];
    });
  };

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_BACKEND_IP}/conversations`,
          {
            withCredentials: true,
          }
        );
        // console.log("Response data:", response.data);

        // Directly set the response data
        setConversations(response.data);
      } catch (error: any) {
        if (error.response && error.response.status === 401) {
          // If 401 Unauthorized, update the state to show login prompt
          // redirect to /chat

          setIsUnauthorized(true);
        } else {
          console.error("Error fetching conversations:", error);
        }
      }
    };

    fetchConversations();
  }, []);

  useEffect(() => {
    const eventsHandler = EventsHandler.getInstance();

    const addConversationToList = async (conversationId: string) => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_BACKEND_IP}/conversations/${conversationId}`,
          { withCredentials: true }
        );
        const newConversation = response.data;

        addConversation(newConversation);
        // setConversations((prevConversations) => {
        //   return [...prevConversations, newConversation];
        // });
      } catch (error) {
        console.error("Error fetching conversation details:", error);
      }
    };

    const handleAddConversation = async (data: any) => {
      // console.log(
      //   "ADD_CONVERSATION_TO_LIST received in conversations-list with zod:",
      //   data
      // );

      const result = AddConversationToListSchema.safeParse(data);

      if (!result.success) {
        console.error("Invalid data received:", result.error);
        return;
      }

      const validatedDate: z.infer<typeof AddConversationToListSchema> =
        result.data;

      addConversationToList(validatedDate.conversationId);

      //   try {
      //     const response = await axios.get(
      //       `${process.env.REACT_APP_BACKEND_IP}/conversations/${validatedDate.conversationId}`,
      //       { withCredentials: true }
      //     );
      //     const newConversation = response.data;

      //     setConversations((prevConversations) => {
      //       return [...prevConversations, newConversation];
      //     });
      //   } catch (error) {
      //     console.error("Error fetching conversation details:", error);
      //   }
    };

    const handleRemoveConversation = (data: any) => {
      // console.log(
      //   "REMOVE_CONVERSATION_FROM_LIST received in conversations-list:",
      //   data
      // );

      const result = RemoveConversationFromListSchema.safeParse(data);

      if (!result.success) {
        console.error("Invalid data received:", result.error);
        return;
      }

      const validatedDate: z.infer<typeof RemoveConversationFromListSchema> =
        result.data;

      //   setConversations((prevConversations) => {
      //     return prevConversations.filter(
      //       (conversation) =>
      //         conversation.conversationId !== validatedDate.conversationId
      //     );
      //   });
    };

    const handleGroupUserStatusUpdate = (
      data: z.infer<typeof GroupUserStatusUpdateSchema>
    ) => {
      // console.log(
      //   "GROUP_USER_STATUS_UPDATED received in conversations-list:",
      //   data
      // );

      if (
        data.userId === me.id &&
        (data.action === GroupUserStatusAction.KICK ||
          data.action === GroupUserStatusAction.BAN)
      ) {
        removeConversation(data.conversationId);
      }

      //   if (data.userId === me.id && data.action === GroupUserStatusAction.JOIN) {
      //     addConversationToList(data.conversationId);
      //   }
    };

    eventsHandler.on("ADD_CONVERSATION_TO_LIST", handleAddConversation);
    eventsHandler.on("REMOVE_CONVERSATION_FROM_LIST", handleRemoveConversation);
    eventsHandler.on("GROUP_USER_STATUS_UPDATED", handleGroupUserStatusUpdate);

    return () => {
      eventsHandler.off("ADD_CONVERSATION_TO_LIST", handleAddConversation);
      eventsHandler.off(
        "REMOVE_CONVERSATION_FROM_LIST",
        handleRemoveConversation
      );
      eventsHandler.off(
        "GROUP_USER_STATUS_UPDATED",
        handleGroupUserStatusUpdate
      );
    };
  }, []);

  const handleLogin = async () => {
    const currentPath = window.location.pathname; // Get the path after localhost
    const redirectUrl = encodeURIComponent(currentPath); // Ensure the path is URL encoded
    // console.log("Redirect URL:", redirectUrl);
    try {
      //TODO: add api query param for custom redirect
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_IP}/auth/`,
        {
          //Auth will call the getAuth
          withCredentials: true, // Include cookies (not necessary)
        }
      );
      // console.log("Response:", response.data);
      window.location.href = response.data.url; // Redirect toward the login page if necessary
    } catch (error) {
      console.error("Error in the connection:", error);
      alert("Error in the connection process");
    }
  };

  const leaveGroup = async (conversationId: string) => {
    // console.log("Leaving group:", conversationId);
    try {
      const response = await axios.delete(
        `${process.env.REACT_APP_BACKEND_IP}/conversations/leave-conversation/${conversationId}`,
        { withCredentials: true }
      );
      // console.log("User removed from group:", response.data);
      removeConversation(conversationId);
      toast.success("Successfully left the group!", { duration: 3000 });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Axios error:", error.response?.data || error.message);
        setError("Failed to leave the group. Please try again.");
        toast.error(error.response?.data.message || error.message, {
          duration: 5000,
        });
      } else {
        console.error("Unexpected error:", error);
        setError("An unexpected error occurred.");
      }
    }
  };

  if (isUnauthorized) {
    // If unauthorized, render a login page or redirect
    return (
      //TODO: replace 128 with a variable representing the height of the navbar
      <div className="h-[calc(100vh-128px)] flex flex-col items-center justify-center bg-transparent text-white">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">
            You must be logged in to access the chat
          </h2>
          <p className="text-lg mb-4">
            Please{" "}
            <span
              onClick={handleLogin}
              className="cursor-pointer text-blue-500 underline"
            >
              log in
            </span>{" "}
            to continue.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {conversations.map((conversation) => {
        let participant = conversation.participants[0];
        //   const participant = conversation.participants[0]; // Assume the first participant is relevant
        const isSelected =
          location.pathname === `/chat/${conversation.conversationId}`;
        return (
          <ContextMenu key={conversation.conversationId}>
            <ContextMenuTrigger>
              <Link
                to={`/chat/${conversation.conversationId}`}
                key={conversation.conversationId}
                className={`block rounded-lg p-2 ${
                  isSelected ? "bg-gray-900" : "hover:bg-gray-900"
                }`}
              >
                <Card
                  className={`flex items-center space-x-2 border-none shadow-none bg-transparent ${
                    isSelected ? "bg-gray-900" : "bg-transparent"
                  }`}
                >
                  {/* Avatar */}
                  <Avatar className="w-12 h-12">
                    {conversation.type === "GROUP" ? (
                      <Users className="w-12 h-12 text-gray-500" />
                    ) : (
                      <AvatarImage
                        src={participant.avatar}
                        alt={`${participant.username}'s avatar`}
                      />
                    )}
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-semibold text-xl ml-4">
                      {conversation.type === "DM"
                        ? participant.username || "Unknown User"
                        : conversation.name || "Group Name"}
                    </span>
                  </div>
                </Card>
              </Link>
            </ContextMenuTrigger>
            <ContextMenuContent className="bg-slate-900 border-none">
              <ContextMenuItem
                onClick={() => leaveGroup(conversation.conversationId)}
                className="text-red-500 hover:bg-slate-600"
              >
                {/* ${conversation.conversationId} */}
                Leave group
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        );
      })}
    </div>
  );
};

export default ConversationList;

import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom"; // Added useNavigate for redirection
import { Avatar, AvatarImage } from "../ui/avatar";
import { Card, CardContent, CardTitle } from "../ui/card";
import axios from "axios";
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
} from "../../common/types/event-type";

const ConversationList = () => {
  const location = useLocation(); // Get the current location (URL)
  const history = useNavigate(); // Used for redirection
  const [conversations, setConversations] = useState<any[]>([]);
  const [isUnauthorized, setIsUnauthorized] = useState(false); // State to handle unauthorized

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3000/conversations",
          {
            withCredentials: true,
          }
        );
        console.log("Response data:", response.data);

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

    const handleAddConversation = async (data: any) => {
      console.log(
        "ADD_CONVERSATION_TO_LIST received in conversations-list with zod:",
        data
      );

      const result = AddConversationToListSchema.safeParse(data);

      if (!result.success) {
        console.error("Invalid data received:", result.error);
        return;
      }

      const validatedDate: z.infer<typeof AddConversationToListSchema> =
        result.data;

      try {
        const response = await axios.get(
          `http://localhost:3000/conversations/${validatedDate.conversationId}`,
          { withCredentials: true }
        );
        const newConversation = response.data;

        setConversations((prevConversations) => {
          return [...prevConversations, newConversation];
        });
      } catch (error) {
        console.error("Error fetching conversation details:", error);
      }
    };

    const handleRemoveConversation = (data: any) => {
      console.log(
        "REMOVE_CONVERSATION_FROM_LIST received in conversations-list:",
        data
      );

      const result = RemoveConversationFromListSchema.safeParse(data);

      if (!result.success) {
        console.error("Invalid data received:", result.error);
        return;
      }

      const validatedDate: z.infer<typeof RemoveConversationFromListSchema> =
        result.data;

      setConversations((prevConversations) => {
        return prevConversations.filter(
          (conversation) =>
            conversation.conversationId !== validatedDate.conversationId
        );
      });
    };

    eventsHandler.on("ADD_CONVERSATION_TO_LIST", handleAddConversation);
    eventsHandler.on("REMOVE_CONVERSATION_FROM_LIST", handleRemoveConversation);

    return () => {
      eventsHandler.off("ADD_CONVERSATION_TO_LIST", handleAddConversation);
      eventsHandler.off(
        "REMOVE_CONVERSATION_FROM_LIST",
        handleRemoveConversation
      );
    };
  }, []);

  const handleLogin = async () => {
    const currentPath = window.location.pathname; // Get the path after localhost
    const redirectUrl = encodeURIComponent(currentPath); // Ensure the path is URL encoded
    console.log("Redirect URL:", redirectUrl);
    try {
      //TODO: add api query param for custom redirect
      const response = await axios.get("http://localhost:3000/auth/", {
        //Auth will call the getAuth
        withCredentials: true, // Include cookies (not necessary)
      });
      console.log("Response:", response.data);
      window.location.href = response.data.url; // Redirect toward the login page if necessary
    } catch (error) {
      console.error("Error in the connection:", error);
      alert("Error in the connection process");
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
        );
      })}
    </div>
  );
};

export default ConversationList;

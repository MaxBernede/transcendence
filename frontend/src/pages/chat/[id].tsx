import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom"; // Import useNavigate and useOutletContext
import axios from "axios";
import MessageInput from "../../components/chat/message-input";
import ChannelParticipants from "../../components/chat/chat-participants";
import EventsHandler from "../../events/EventsHandler";
import { Socket } from "socket.io-client";
import { ChatMessageType } from "../../components/chat/types";
import { RemoveConversationFromListSchema } from "../../common/types/event-type"; // Import the schema
import { Message } from "../../common/types/chat-type"; // Import the schema

import { z } from "zod";
import { UserPayload, useUserContext } from "../../context";
import ChatMessage from "../../components/chat/chat-message";
import GameInviteMessage from "../../components/chat/chat-game-invite";

// Define types and schemas
// type PublicUserInfoDto = { id: number; username: string; avatar: string };

// interface Message {
//   id: string;
//   text: string;
//   timestamp: string;
//   senderUser: PublicUserInfoDto;
// }

const ChatPage = () => {
  const { channelId } = useParams();
  const [messagesByRoom, setMessagesByRoom] = useState(
    new Map<string, Message[]>()
  );
  const [newMessage, setNewMessage] = useState("");
  //   const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  //   const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  const { socket }: { socket: Socket | null } = useOutletContext(); // Access the socket from Outlet context

  const user: UserPayload = useUserContext();

  useEffect(() => {
    const eventsHandler = EventsHandler.getInstance();
    const handleUserRemoved = (data: any) => {
      const result = RemoveConversationFromListSchema.safeParse(data);

      if (!result.success) {
        console.error("Invalid data received:", result.error);
        return;
      }

      const validatedData: z.infer<typeof RemoveConversationFromListSchema> =
        result.data;

      if (validatedData.conversationId === channelId) {
        navigate("/chat"); // Redirect if the user is removed from the conversation
      }
    };

    eventsHandler.on("REMOVE_CONVERSATION_FROM_LIST", handleUserRemoved);

    return () => {
      eventsHandler.off("REMOVE_CONVERSATION_FROM_LIST", handleUserRemoved);
    };
  }, [channelId, navigate]);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const { data } = await axios.get(
          "http://localhost:3000/conversations/history",
          {
            withCredentials: true,
          }
        );

        const messageMap = new Map<string, Message[]>();
        let isConversationAccessible = false;

        data.forEach((conversation: any) => {
          if (conversation.conversationId === channelId) {
            isConversationAccessible = true;
          }
          messageMap.set(conversation.conversationId, conversation.chat);
        });

        if (!isConversationAccessible) {
          navigate("/chat");
        } else {
          setMessagesByRoom(messageMap);
        }
      } catch (error) {
        console.error("Failed to fetch conversations:", error);
        navigate("/chat");
      }
    };

    fetchConversations();

    // Set up socket listeners - this needs to happen even if no history yet
    const setupSocketListeners = () => {
      if (!socket) return;

      // First remove any existing listeners to prevent duplicates
      socket.off("chatToClient");

      socket.on("chatToClient", (data: Message) => {
        console.log("Received message:", data);
        setMessagesByRoom((prev) => {
          const updated = new Map(prev);
          const roomMessages = updated.get(data.conversationId) || [];
          updated.set(data.conversationId, [...roomMessages, data]);
          return updated;
        });
      });
    };

    setupSocketListeners();

    // Join the conversation room explicitly when entering the chat
    if (socket && channelId) {
      console.log("Joining room:", channelId);
      socket.emit("joinRoom", { conversationId: channelId });
    }

    return () => {
      if (socket) {
        socket.off("chatToClient");
      }
    };
  }, [channelId, navigate, socket]);

  const chatMessages = messagesByRoom.get(channelId || "") || [];

  const handleSendMessage = () => {
    if (!newMessage.trim() || !socket || !channelId) return;

    // No local message addition anymore - rely solely on server response
    socket.emit("chatToServer", {
      conversationId: channelId,
      message: newMessage,
    });

    setNewMessage("");
  };

  return (
    <div className="flex h-full">
      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <h2 className="text-2xl font-bold mb-4 py-3">Chat #{channelId}</h2>
        <div className="flex-1 overflow-y-auto bg-gray-800 p-4 rounded-lg min-w-0">
          {chatMessages.map((msg) => {
            console.log("Message:", msg);
            if (msg.type === "TEXT") {
              console.log("Text message:");
              return (
                <div key={msg.id} className="mb-2 min-w-0">
                  <ChatMessage
                    messageObject={msg}
                    currentUserId={user.id as number}
                  />
                </div>
              );
            } else if (msg.type === "GAME_INVITE") {
              console.log("Game invite message:");
              return (
                <div key={msg.id} className="mb-2">
                  <GameInviteMessage
                    messageObject={msg}
                    currentUserId={user.id as number}
                  />
                </div>
              );
            }
          })}
          <div ref={messagesEndRef} />
        </div>
        <MessageInput
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onSend={handleSendMessage}
        />
      </div>

      <div className="w-128 bg-gray-700 text-white p-4 rounded-lg ml-4">
        <ChannelParticipants
          channelId={channelId as string}
          currentUserId={user.id as number}
        />
      </div>
    </div>
  );
};

export default ChatPage;

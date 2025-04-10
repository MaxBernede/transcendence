import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom"; // Import useNavigate and useOutletContext
import axios from "axios";
import ChatMessage from "../../components/chat/chat-message";
import MessageInput from "../../components/chat/message-input";
import ChannelParticipants from "../../components/chat/chat-participants";
import EventsHandler from "../../events/EventsHandler";
import { Socket } from "socket.io-client";
import { ChatMessageType } from "../../components/chat/types";
import { RemoveConversationFromListSchema } from "../../common/types/event-type"; // Import the schema
// import { Message } from "../../common/types/chat-type"; // Import the schema

import { z } from "zod";
import { UserPayload, useUserContext } from "../../context";

// Define types and schemas
type PublicUserInfoDto = { id: number; username: string; avatar: string };

interface Message {
  id: string;
  text: string;
  timestamp: string;
  senderUser: PublicUserInfoDto;
}

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
          const formattedMessages = conversation.chat.map((chat: any) => ({
            id: chat.messageId,
            text: chat.text,
            timestamp: chat.createdAt,
            senderUser: {
              id: chat.senderUser.userId,
              username: chat.senderUser.username,
              avatar: chat.senderUser.avatar,
            },
          }));
          messageMap.set(conversation.conversationId, formattedMessages);
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
      
      // Then add the listener again
      socket.on("chatToClient", (data: any) => {
        console.log("Received message:", data);
        const receivedMsg: Message = {
          id: data.messageId,
          text: data.message,
          timestamp: data.timestamp,
          senderUser: data.senderUser,
		//   type: data.type,
		//   gameInviteData: data.gameInviteData,
		//   edited: false, // Assuming new messages are not edited
        };

        setMessagesByRoom((prev) => {
          const updated = new Map(prev);
          const roomMessages = updated.get(data.conversationId) || [];
          updated.set(data.conversationId, [...roomMessages, receivedMsg]);
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
      <div className="flex-1 flex flex-col">
        <h2 className="text-2xl font-bold mb-4 py-3">Chat #{channelId}</h2>
        <div className="flex-1 overflow-y-auto bg-gray-800 p-4 rounded-lg space-y-3">
          {chatMessages.map((msg) => {
            const m: ChatMessageType = {
              id: msg.id,
              text: msg.text,
              timestamp: msg.timestamp,
              edited: true,
              user: {
                id: msg.senderUser.id,
                username: msg.senderUser.username,
                avatar: msg.senderUser.avatar,
              },
            };

            return (
              <ChatMessage
                key={m.id}
                messageObject={m}
                currentUserId={user.id as number}
              />
            );
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

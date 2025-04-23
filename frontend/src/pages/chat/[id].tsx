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
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "../../components/ui/context-menu";
import { toast } from "sonner";

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
  const [isAtBottom, setIsAtBottom] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  const { socket }: { socket: Socket | null } = useOutletContext();
  const user: UserPayload = useUserContext();

  const chatMessages = messagesByRoom.get(channelId || "") || [];
  const sortedMessages = [...chatMessages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const checkIfAtBottom = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 10;
    setIsAtBottom(isBottom);
  };

  // Always scroll to bottom on mount
  useEffect(() => {
    scrollToBottom();
  }, []);

  // Handle scroll events
  useEffect(() => {
    const container = chatContainerRef.current;
    if (container) {
      container.addEventListener("scroll", checkIfAtBottom);
      return () => container.removeEventListener("scroll", checkIfAtBottom);
    }
  }, []);

  useEffect(() => {
    const setupSocketListeners = () => {
      if (!socket) return;

      socket.off("chatToClient");

      socket.on("chatToClient", (data: Message) => {
        console.log("Received message:", data);
        setMessagesByRoom((prev) => {
          const updated = new Map(prev);
          const roomMessages = updated.get(data.conversationId) || [];
          const existingIndex = roomMessages.findIndex(
            (msg) => msg.id === data.id
          );
          if (existingIndex !== -1) {
            roomMessages[existingIndex] = data;
          } else {
            roomMessages.push(data);
          }
          updated.set(data.conversationId, roomMessages);
          return updated;
        });
        // Only scroll to bottom if we're already at the bottom
        if (isAtBottom) {
          setTimeout(scrollToBottom, 100);
        }
      });
    };

    setupSocketListeners();

    if (socket && channelId) {
      console.log("Joining room:", channelId);
      socket.emit("joinRoom", { conversationId: channelId });
    }

    return () => {
      if (socket) {
        socket.off("chatToClient");
      }
    };
  }, [channelId, navigate, socket, isAtBottom]);

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
          `${process.env.REACT_APP_BACKEND_IP}/conversations/history`,
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
          // Scroll to bottom after messages are loaded
          setTimeout(() => scrollToBottom(), 0);
        }
      } catch (error) {
        console.error("Failed to fetch conversations:", error);
        navigate("/chat");
      }
    };

    fetchConversations();
  }, [channelId, navigate]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !socket || !channelId) return;

    // No local message addition anymore - rely solely on server response
    socket.emit("chatToServer", {
      conversationId: channelId,
      message: newMessage,
    });

    setNewMessage("");
  };

  const handleCopyChannelId = () => {
    if (channelId) {
      navigator.clipboard
        .writeText(channelId)
        .then(() => {
          toast.success("Channel ID copied to clipboard");
        })
        .catch((err) => {
          console.error("Failed to copy channel ID:", err);
          toast.error("Failed to copy channel ID");
        });
    }
  };

  return (
    <div className="flex h-full">
      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <ContextMenu>
          <ContextMenuTrigger>
            <div className="flex items-center justify-between px-4 py-3 bg-gray-800/50 backdrop-blur-sm rounded-lg m-2 shadow-lg border border-gray-700/50">
              <div className="flex items-center space-x-2">
                <span className="text-gray-400 text-lg">#</span>
                <h2 className="text-xl font-semibold text-white">
                  {channelId}
                </h2>
              </div>
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent className="bg-slate-900 border-none">
            <ContextMenuItem
              onClick={handleCopyChannelId}
              className="hover:bg-blue-500 hover:text-white px-4 py-2"
            >
              Copy Channel ID
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto bg-gray-800 p-4 rounded-lg min-w-0 mx-2"
          onScroll={checkIfAtBottom}
        >
          {sortedMessages.map((msg) => {
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

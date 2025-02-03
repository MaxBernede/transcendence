// import React, { useState, useEffect, useRef } from "react";
// import { useParams } from "react-router-dom";
// import { io, Socket } from "socket.io-client";
// import axios from "axios";
// import ChatMessage from "../../components/chat/chat-message";
// import MessageInput from "../../components/chat/message-input";
// import ChatSidebar from "../../components/chat/chat-participants";

// import { z } from "zod";
// import {
//   ChatMessageType,
//   ServerChatToClient,
// } from "../../components/chat/types";
// import ChannelParticipants from "../../components/chat/chat-participants";

// const PublicUserInfoSchema = z.object({
//   id: z.number(),
//   username: z.string(),
//   avatar: z.string().url(),
// });

// type PublicUserInfoDto = z.infer<typeof PublicUserInfoSchema>;

// interface Message {
//   id: string;
//   text: string;
//   timestamp: string;
//   senderUser: PublicUserInfoDto;
// }

// const ChatPage = () => {
//   const { channelId } = useParams();
//   const [messagesByRoom, setMessagesByRoom] = useState(
//     new Map<string, Message[]>()
//   );
//   const [newMessage, setNewMessage] = useState("");
//   const [socket, setSocket] = useState<Socket | null>(null);
//   const messagesEndRef = useRef<HTMLDivElement | null>(null);
//   const [currentUserId, setCurrentUserId] = useState<number | null>(null);

//   useEffect(() => {
//     const fetchCurrentUser = async () => {
//       try {
//         const { data } = await axios.get("http://localhost:3000/api/users/me", {
//           withCredentials: true,
//         });
//         setCurrentUserId(data.id);
//       } catch (error) {
//         console.error("Failed to fetch current user:", error);
//       }
//     };

//     fetchCurrentUser();
//   }, []);

//   useEffect(() => {
//     const fetchConversations = async () => {
//       try {
//         const { data } = await axios.get(
//           "http://localhost:3000/conversations/history",
//           {
//             withCredentials: true,
//           }
//         );

//         const messageMap = new Map<string, Message[]>();

//         data.forEach((conversation: any) => {
//           const formattedMessages = conversation.chat.map((chat: any) => ({
//             id: chat.messageId,
//             text: chat.text,
//             timestamp: chat.createdAt,
//             senderUser: {
//               id: chat.senderUser.userId,
//               username: chat.senderUser.username,
//               avatar: chat.senderUser.avatar,
//             },
//           }));
//           messageMap.set(conversation.conversationId, formattedMessages);
//         });

//         setMessagesByRoom(messageMap);
//       } catch (error) {
//         console.error("Failed to fetch conversations:", error);
//       }
//     };

//     fetchConversations();

//     const newSocket = io("http://localhost:3000/chat", {
//       withCredentials: true,
//     });
//     setSocket(newSocket);

//     newSocket.on("chatToClient", (data: ServerChatToClient) => {
//       const receivedMsg: Message = {
//         id: data.messageId,
//         text: data.message,
//         timestamp: data.timestamp,
//         senderUser: data.senderUser,
//       };

//       console.log("receivedMsg:", receivedMsg);

//       setMessagesByRoom((prev) => {
//         const updated = new Map(prev);
//         const roomMessages = updated.get(data.conversationId) || [];
//         updated.set(data.conversationId, [...roomMessages, receivedMsg]);
//         return updated;
//       });
//     });

//     return () => {
//       newSocket.close();
//     };
//   }, []);

//   const chatMessages = messagesByRoom.get(channelId || "") || [];

//   const handleSendMessage = () => {
//     if (!newMessage.trim() || !socket || !channelId) return;

//     socket.emit("chatToServer", {
//       conversationId: channelId,
//       message: newMessage,
//     });

//     setNewMessage("");
//   };

//   return (
//     <div className="flex h-full">
//       {/* Chat Area */}
//       <div className="flex-1 flex flex-col">
//         <h2 className="text-2xl font-bold mb-4 py-3">Chat #{channelId}</h2>
//         <h2 className="text-2xl font-bold mb-4 py-3">Chat #{channelId}</h2>
//         <div className="flex-1 overflow-y-auto bg-gray-800 p-4 rounded-lg space-y-3">
//           {chatMessages.map((msg) => {
//             const m: ChatMessageType = {
//               id: msg.id,
//               text: msg.text,
//               timestamp: msg.timestamp,
//               edited: true,
//               user: {
//                 id: msg.senderUser.id,
//                 username: msg.senderUser.username,
//                 avatar: msg.senderUser.avatar,
//               },
//             };

//             return (
//               <ChatMessage
//                 key={m.id}
//                 messageObject={m}
//                 currentUserId={currentUserId as number}
//               />
//             );
//           })}
//           <div ref={messagesEndRef} />
//         </div>
//         <MessageInput
//           value={newMessage}
//           onChange={(e) => setNewMessage(e.target.value)}
//           onSend={handleSendMessage}
//         />
//       </div>

//       {/* Sidebar (Participants) */}
//       <div className="w-128 bg-gray-700 text-white p-4 rounded-lg ml-4">
//         <ChannelParticipants
//           channelId={channelId as string}
//           currentUserId={currentUserId as number}
//         />
//       </div>
//     </div>
//   );
// };

// export default ChatPage;

import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom"; // Import useNavigate
import { io, Socket } from "socket.io-client";
import axios from "axios";
import ChatMessage from "../../components/chat/chat-message";
import MessageInput from "../../components/chat/message-input";
import ChatSidebar from "../../components/chat/chat-participants";
import { z } from "zod";
import {
  ChatMessageType,
  ServerChatToClient,
} from "../../components/chat/types";
import ChannelParticipants from "../../components/chat/chat-participants";
import EventsHandler from "../../events/EventsHandler";

const PublicUserInfoSchema = z.object({
  id: z.number(),
  username: z.string(),
  avatar: z.string().url(),
});

type PublicUserInfoDto = z.infer<typeof PublicUserInfoSchema>;

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
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const navigate = useNavigate(); // Initialize the useNavigate hook

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const { data } = await axios.get("http://localhost:3000/api/users/me", {
          withCredentials: true,
        });
        setCurrentUserId(data.id);
      } catch (error) {
        console.error("Failed to fetch current user:", error);
      }
    };

    fetchCurrentUser();
  }, []);

  useEffect(() => {
    const eventsHandler = EventsHandler.getInstance();

    const handleUserRemoved = (data: any) => {
      console.log("USER_REMOVED_FROM_CHAT received: ", data);

      if (data.id === channelId && data.userId === currentUserId) {
        console.log(`User removed from current chat: ${channelId}`);
        navigate("/chat"); // Redirect to main chat page
      }
    };

    eventsHandler.on("USER_REMOVED_FROM_CHAT", handleUserRemoved);

    return () => {
      eventsHandler.off("USER_REMOVED_FROM_CHAT", handleUserRemoved);
    };
  }, [channelId, navigate, currentUserId]); // Dependency array ensures this effect runs when channelId changes

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
        let isConversationAccessible = false; // Flag to track if user has access

        data.forEach((conversation: any) => {
          if (conversation.conversationId === channelId) {
            // Check if the conversationId matches and user has access
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
          // Redirect to /chat if the conversation doesn't exist or user has no access
          navigate("/chat");
        } else {
          setMessagesByRoom(messageMap);
        }
      } catch (error) {
        console.error("Failed to fetch conversations:", error);
        navigate("/chat"); // Fallback redirect if there's an error fetching conversations
      }
    };

    fetchConversations();

    const newSocket = io("http://localhost:3000/chat", {
      withCredentials: true,
    });
    setSocket(newSocket);

    newSocket.on("chatToClient", (data: ServerChatToClient) => {
      const receivedMsg: Message = {
        id: data.messageId,
        text: data.message,
        timestamp: data.timestamp,
        senderUser: data.senderUser,
      };

      console.log("receivedMsg:", receivedMsg);

      setMessagesByRoom((prev) => {
        const updated = new Map(prev);
        const roomMessages = updated.get(data.conversationId) || [];
        updated.set(data.conversationId, [...roomMessages, receivedMsg]);
        return updated;
      });
    });

    return () => {
      newSocket.close();
    };
  }, [channelId, navigate]); // Add navigate and channelId as dependencies

  const chatMessages = messagesByRoom.get(channelId || "") || [];

  const handleSendMessage = () => {
    if (!newMessage.trim() || !socket || !channelId) return;

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
                currentUserId={currentUserId as number}
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

      {/* Sidebar (Participants) */}
      <div className="w-128 bg-gray-700 text-white p-4 rounded-lg ml-4">
        <ChannelParticipants
          channelId={channelId as string}
          currentUserId={currentUserId as number}
        />
      </div>
    </div>
  );
};

export default ChatPage;

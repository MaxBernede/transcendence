// components/ChatMessage.tsx
import { Card } from "../ui/card";
import { Avatar, AvatarImage } from "../ui/avatar";
import React, { useState } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "../ui/context-menu";
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
import { ChatMessageType } from "./types";
import { Message } from "@/common/types/chat-type";
import { useNavigate } from "react-router-dom";
import axios from "axios";

interface ChatMessageProps {
  messageObject: Message;
  //   messageObject: ChatMessageType;
  currentUserId: number;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  messageObject,
  currentUserId,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const isMyMessage = messageObject.senderUser.userId === currentUserId;
  const navigate = useNavigate();

  // Handlers
  function handleEdit() {
    // console.log("Edit message");
  }

  function handleDelete() {
    setIsDialogOpen(true);
  }

  function handleCopy() {
    navigator.clipboard
      .writeText(messageObject.text)
      .then(() => {
        toast.success("Message copied to clipboard");
      })
      .catch((err) => {
        console.error("Failed to copy message:", err);
        toast.error("Failed to copy message");
      });
  }

  function handleCopyMessageId() {
    navigator.clipboard
      .writeText(messageObject.id.toString())
      .then(() => {
        toast.success(`Message ID ${messageObject.id} copied to clipboard`);
      })
      .catch((err) => {
        console.error("Failed to copy message ID:", err);
        toast.error("Failed to copy message ID");
      });
  }

  function handleViewProfile() {
    navigate(`/user/${messageObject.senderUser.username}`);
  }

  async function handleInviteToPong() {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_IP}/pong/createInvite`,
        {
          username: messageObject.senderUser.username,
          userId: messageObject.senderUser.userId,
          conversationId: messageObject.conversationId,
        },
        { withCredentials: true }
      );
      // console.log("Invite created:", response.data);
      // Navigate to the pong game page with the room ID
      //   navigate(`/pong/${response.data.roomId}`);
    } catch (error) {
      console.error("Failed to create invite:", error);
    }
  }

  function closeDialog() {
    setIsDialogOpen(false);
  }

  function confirmDelete() {
    // console.log("Message deleted");
    setIsDialogOpen(false);
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <Card className="w-full p-3 py-1 rounded-lg border-none bg-transparent shadow-none flex flex-col justify-start hover:bg-gray-900">
          <div className="flex items-start gap-2 mb-2 max-w-full overflow-hidden">
            <Avatar className="w-12 h-12 flex-shrink-0">
              <AvatarImage src={messageObject.senderUser.avatar} />
            </Avatar>
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
              <span className="font-semibold truncate">
                {messageObject.senderUser.username}
                <span className="ml-2 text-xs text-gray-400">
                  {messageObject.createdAt
                    ? new Date(messageObject.createdAt).toLocaleString()
                    : "Invalid date"}
                </span>
              </span>
              <p className="break-words whitespace-pre-wrap overflow-hidden">
                {messageObject.text}
                {messageObject.edited && (
                  <span className="text-xs text-gray-400 ml-1">(edited)</span>
                )}
              </p>
            </div>
          </div>
        </Card>
      </ContextMenuTrigger>

      <ContextMenuContent className="bg-slate-900 border-none">
        <ContextMenuItem
          onClick={handleViewProfile}
          className="hover:bg-blue-500 hover:text-white px-4 py-2"
        >
          Profile
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => handleCopy()}
          className="hover:bg-blue-500 hover:text-white px-4 py-2"
        >
          Copy Message
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => handleCopyMessageId()}
          className="hover:bg-blue-500 hover:text-white px-4 py-2"
        >
          Copy Message ID
        </ContextMenuItem>
        {!isMyMessage && (
          <ContextMenuItem
            onClick={handleInviteToPong}
            className="hover:bg-green-500 hover:text-white px-4 py-2"
          >
            Invite to Pong
          </ContextMenuItem>
        )}
        {/* {isMyMessage && (
          <>
            <ContextMenuItem
              onClick={() => handleEdit()}
              className="hover:bg-blue-500 hover:text-white px-4 py-2"
            >
              Edit Message
            </ContextMenuItem>
            <ContextMenuItem
              onClick={handleDelete}
              className="hover:bg-red-500 hover:text-white px-4 py-2"
            >
              Delete Message
            </ContextMenuItem>
          </>
        )} */}
      </ContextMenuContent>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent className="bg-slate-900 text-white rounded-lg border-none">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to delete this message?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              message from the chat.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-between">
            <AlertDialogCancel
              onClick={closeDialog}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ContextMenu>
  );
};

export default ChatMessage;

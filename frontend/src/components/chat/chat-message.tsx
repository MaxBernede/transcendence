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

interface ChatMessageProps {
  messageObject: ChatMessageType;
  currentUserId: number;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  messageObject,
  currentUserId,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const isMyMessage = messageObject.user.id === currentUserId;

  // Handlers
  function handleEdit() {
    console.log("Edit message");
  }

  function handleDelete() {
    setIsDialogOpen(true);
  }

  function handleCopy() {
    console.log("Copy message");
  }

  function handleCopyMessageId() {
    console.log("Copy message ID");
  }

  function closeDialog() {
    setIsDialogOpen(false);
  }

  function confirmDelete() {
    console.log("Message deleted");
    setIsDialogOpen(false);
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <Card className="w-full p-3 py-1 rounded-lg border-none bg-transparent shadow-none flex flex-col justify-start hover:bg-gray-900">
          <div className="flex items-start gap-2 mb-2">
            <Avatar className="w-12 h-12">
              <AvatarImage src={messageObject.user.avatar} />
            </Avatar>
            <div className="flex flex-col">
              <span className="font-semibold">
                {messageObject.user.username}
                <span className="ml-2 text-xs text-gray-400">
                  {new Intl.DateTimeFormat("en-US", {
                    dateStyle: "short",
                    timeStyle: "medium",
                  }).format(new Date(messageObject.timestamp))}
                </span>
              </span>
              <p className="whitespace-pre-wrap break-words">
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
        {isMyMessage && (
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
        )}
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

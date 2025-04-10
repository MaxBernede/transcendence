// message-card-schema.ts
import { time } from "console";
import { use } from "passport";
import { text } from "stream/consumers";
import { z } from "zod";

export const MessageCardSchema = z.object({
  text: z.string().min(1, "Message text is required"),
  avatar: z.string().url("Invalid avatar URL"),
  username: z.string().min(1, "Username is required"),
  timestamp: z.string(), // Timestamp of the message
});

export type MessageCard = z.infer<typeof MessageCardSchema>;

export const ServerChatToClientSchema = z.object({
  messageId: z.string().nonempty(),
  message: z.string().nonempty(),
  timestamp: z.string().nonempty(),
  conversationId: z.string().nonempty(),
  senderUser: z.object({
    id: z.number(),
    username: z.string(),
    avatar: z.string().url(),
  }),
});

export type ServerChatToClient = z.infer<typeof ServerChatToClientSchema>;

export const ChatMessageSchema = z.object({
  id: z.string().nonempty(),
  text: z.string().nonempty(),
  timestamp: z.string().nonempty(),
  edited: z.boolean(),
  user: z.object({
    id: z.number(),
    username: z.string().nonempty(),
    avatar: z.string().url(),
  }),
});

export type ChatMessageType = z.infer<typeof ChatMessageSchema>;

export const PublicUserInfoSchema = z.object({
  id: z.number(),

  username: z.string(),
  avatar: z.string().url(),
  createdAt: z.string(),
  wins: z.number(),
  losses: z.number(),

  groupRole: z.string(),
  banned: z.boolean(),
  muted_untill: z.date().nullable(),
});

export type PublicUserInfo = z.infer<typeof PublicUserInfoSchema>;

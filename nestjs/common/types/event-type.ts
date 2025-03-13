import { z } from 'zod';

export enum EventsType {
  //   USER_ADDED_TO_CHAT = 'USER_ADDED_TO_CHAT',
  //   USER_REMOVED_FROM_CHAT = 'USER_REMOVED_FROM_CHAT',

  //? sent to the user who was removed from the conversation
  //? "data": { "conversationId": string }
  REMOVE_CONVERSATION_FROM_LIST = 'REMOVE_CONVERSATION_FROM_LIST',

  //? sent to all participants in the conversation
  //? "data": { "conversationId": string }
  ADD_CONVERSATION_TO_LIST = 'ADD_CONVERSATION_TO_LIST',

  //? sent to all participants in the conversation
  //? "data": {
  //?   "conversationId": string,
  //?   "addedUserId"?: number,  // Optional: Only if a user is added
  //?   "removedUserId"?: number // Optional: Only if a user is removed
  //? }
  UPDATE_PARTICIPANT_LIST = 'UPDATE_PARTICIPANT_LIST',

  ADD_PARTICIPANT_TO_CONVERSATION = 'ADD_PARTICIPANT_TO_CONVERSATION',
  REMOVE_PARTICIPANT_FROM_CONVERSATION = 'REMOVE_PARTICIPANT_FROM_CONVERSATION',

  GROUP_ROLE_UPDATED = 'GROUP_ROLE_UPDATED',
  GROUP_USER_STATUS_UPDATED = 'GROUP_USER_STATUS_UPDATED',
}

export enum GroupUserStatusAction {
  KICK = 'kick',
  BAN = 'ban',
  UNBAN = 'unban',
  MUTE = 'mute',
  UNMUTE = 'unmute',
  TIMEOUT = 'timeout',
  LEAVE = 'leave',
  JOIN = 'join',
}

export const GroupUserStatusUpdateSchema = z.object({
  conversationId: z.string(), // The group/chat ID
  userId: z.number(), // The affected user
  action: z.nativeEnum(GroupUserStatusAction), // Uses the enum
  duration: z.number().optional(), // Only for "timeout" (in seconds)
  reason: z.string().optional(), // Optional reason for the action
});

export const AddParticipantToConversationSchema = z.object({
  conversationId: z.string().uuid(),
  userId: z.number(),
});

export const RemoveParticipantFromConversationSchema = z.object({
  conversationId: z.string().uuid(),
  userId: z.number(),
});

export const AddConversationToListSchema = z.object({
  conversationId: z.string().uuid(), // Ensure conversationId is a valid UUID string
});

export const RemoveConversationFromListSchema = z.object({
  conversationId: z.string().uuid(), // Ensure conversationId is a valid UUID string
});

export const UpdateMemberRoleSchema = z.object({
  conversationId: z.string().uuid(),
  memberId: z.number(),
  role: z.string(),
});

export enum UserActionType {
  ADDED = 'ADDED',
  REMOVED = 'REMOVED',
}

export const UpdateParticipantListSchema = z.object({
  data: z
    .object({
      conversationId: z.string().uuid(),
      addedUserId: z.number().optional(),
      removedUserId: z.number().optional(),
    })
    .refine(
      (data) => {
        // Ensure at least one field is set, and not both
        return (
          (data.addedUserId || data.removedUserId) &&
          !(data.addedUserId && data.removedUserId)
        );
      },
      {
        message:
          'Either addedUserId or removedUserId must be set, but not both.',
      },
    ),
});

import React, { useEffect, useState } from "react";
import axios from "axios";
import { PublicUserInfo } from "./types";
import { DmParticipants } from "./chat-participants-dm";
import { GroupParticipants } from "./chat-participants-group";
import EventsHandler from "../../events/EventsHandler"; // Import the event handler singleton

import { set, z } from "zod";

import {
  GroupUserStatusAction,
  GroupUserStatusUpdateSchema,
  RemoveParticipantFromConversationSchema,
} from "../../common/types/event-type";
import { UserPayload, useUserContext } from "@/context";
import { useNavigate } from "react-router-dom";

interface ChannelParticipantsProps {
  channelId: string;
  currentUserId: number;
}

const ChannelParticipants: React.FC<ChannelParticipantsProps> = ({
  channelId,
  currentUserId,
}) => {
  const [participants, setParticipants] = useState<PublicUserInfo[]>([]);
  const [conversationType, setConversationType] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  const navigate = useNavigate();

  // Fetch participants from the backend
  const fetchParticipants = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `http://localhost:3000/conversations/${channelId}/participants`,
        {
          withCredentials: true,
        }
      );
      const data = response.data;

      console.log(data);
      const formattedParticipants: PublicUserInfo[] = data.participants.map(
        (participant: any) => ({
          id: participant.id,
          username: participant.username,
          avatar: participant.avatar,
          createdAt: participant.created_at,
          wins: participant.wins,
          losses: participant.loose,
          groupRole: participant.group_role,
          banned: participant.banned,
          muted_untill: participant.muted_untill,
        })
      );

      setParticipants(formattedParticipants);
      setConversationType(data.conversationType);
    } catch (error) {
      console.error("Error fetching participants:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchParticipants();
  }, [channelId]);

  useEffect(() => {
    const eventsHandler = EventsHandler.getInstance();

    const handleRoleUpdate = async (data: any) => {
      console.log("GROUP_ROLE_UPDATED received in conversations-list:", data);

      //? data: { conversationId: "", memberId: 1, role: "ADMIN" }

      // Update the participants list
      setParticipants((prevParticipants) =>
        prevParticipants.map((participant) =>
          participant.id === data.memberId
            ? { ...participant, groupRole: data.role } // Update the role for the matching user
            : participant
        )
      );
    };

    eventsHandler.on("GROUP_ROLE_UPDATED", handleRoleUpdate);

    return () => {
      eventsHandler.off("GROUP_ROLE_UPDATED", handleRoleUpdate);
    };
  }, []);

  useEffect(() => {
    const eventsHandler = EventsHandler.getInstance();

    const handleRemoveConversation = (data: any) => {
      console.log(
        "REMOVE_PARTICIPANT_FROM_CONVERSATION received in conversations-list:",
        data
      );

      const result = RemoveParticipantFromConversationSchema.safeParse(data);

      if (!result.success) {
        console.error("Invalid data received:", result.error);
        return;
      }

      const validatedDate: z.infer<
        typeof RemoveParticipantFromConversationSchema
      > = result.data;

      setParticipants((prevParticipants) => {
        return prevParticipants.filter(
          (participant) => participant.id !== validatedDate.userId
        );
      });
    };

    const handleAddParticipant = async (data: any) => {
      console.log(
        "ADD_PARTICIPANT_TO_CONVERSATION received in conversations-list:",
        data
      );

      try {
        const user = await axios.get(
          `http://localhost:3000/api/users/${data.userId}`,
          {
            withCredentials: true,
          }
        );
        setParticipants((prevParticipants) => [
          ...prevParticipants,
          {
            id: data.userId,
            username: user.data.username,
            avatar: user.data.avatar,
            createdAt: user.data.created_at,
            wins: user.data.wins,
            losses: user.data.loose,
            groupRole: "MEMBER",
            banned: false,
            muted_untill: null,
          },
        ]);
        console.log("User data:", user.data);
      } catch (error) {
        console.error("Invalid data received:", error);
      }
    };

    const handleEventActionKick = async (
		data: z.infer<typeof GroupUserStatusUpdateSchema>
	  ) => {if (data.userId === currentUserId) {
        //? if the current page is the conversation page, redirect to the home page
        if (data.conversationId === channelId) {
          // redirect to /chat
          //   window.location.href = "/chat";
          navigate("/chat");
        }
      }
    };

	const handleEventActionBan = async (
      data: z.infer<typeof GroupUserStatusUpdateSchema>
    ) => {
      console.log("BAN action received in conversations-list:", data);
      console.log("Current user ID:", currentUserId);
      // if banned user === me, remove from participants
      if (data.userId === currentUserId) {
        console.log("Banned user is me, removing from participants");
        //? if the current page is the conversation page, redirect to the home page
        if (data.conversationId === channelId) {
          // redirect to /chat
          //   window.location.href = "/chat";
          navigate("/chat");
        }

        setParticipants((prevParticipants) => {
          return prevParticipants.filter(
            (participant) => participant.id !== data.userId
          );
        });
      } else {
        console.log(
          "Banned user is not me, updating participants:",
          currentUserId
        );
        setParticipants((prev) => {
          const index = prev.findIndex((p) => p.id === data.userId);
          if (index === -1) return prev; // No change needed

          const updatedParticipants = [...prev];
          updatedParticipants[index] = {
            ...updatedParticipants[index],
            banned: true,
          };

          return updatedParticipants;
        });
      }
    };

    const handleEventActionUnban = async (
      data: z.infer<typeof GroupUserStatusUpdateSchema>
    ) => {
      console.log("UNBAN action received in conversations-list:", data);

      setParticipants((prev) => {
        // Filter out the user with the matching ID
        return prev.filter((participant) => participant.id !== data.userId);
      });
    };

    const handleGroupUserStatusUpdate = async (
      data: z.infer<typeof GroupUserStatusUpdateSchema>
    ) => {
      console.log(
        "GROUP_USER_STATUS_UPDATED received in conversations-list:",
        data
      );

      switch (data.action) {
        case GroupUserStatusAction.BAN:
          handleEventActionBan(data);
          break;
        case GroupUserStatusAction.UNBAN:
          handleEventActionUnban(data);
          break;
        case GroupUserStatusAction.KICK:
          handleEventActionKick(data);
          break;
      }
    };

    eventsHandler.on(
      "REMOVE_PARTICIPANT_FROM_CONVERSATION",
      handleRemoveConversation
    );

    eventsHandler.on("ADD_PARTICIPANT_TO_CONVERSATION", handleAddParticipant);

    eventsHandler.on("GROUP_USER_STATUS_UPDATED", handleGroupUserStatusUpdate);

    return () => {
      eventsHandler.off(
        "REMOVE_PARTICIPANT_FROM_CONVERSATION",
        handleRemoveConversation
      );
      eventsHandler.off(
        "ADD_PARTICIPANT_TO_CONVERSATION",
        handleAddParticipant
      );
      eventsHandler.off(
        "GROUP_USER_STATUS_UPDATED",
        handleGroupUserStatusUpdate
      );
    };
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {conversationType === "DM" ? (
        <DmParticipants
          participants={participants}
          currentUserId={currentUserId}
        />
      ) : (
        <GroupParticipants
          participants={participants}
          currentUserId={currentUserId}
          conversationId={channelId}
        />
      )}
    </div>
  );
};

export default ChannelParticipants;

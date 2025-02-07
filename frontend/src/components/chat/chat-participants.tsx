import React, { useEffect, useState } from "react";
import axios from "axios";
import { PublicUserInfo } from "./types";
import { DmParticipants } from "./chat-participants-dm";
import { GroupParticipants } from "./chat-participants-group";
import EventsHandler from "../../events/EventsHandler"; // Import the event handler singleton

import { set, z } from "zod";

import { RemoveParticipantFromConversationSchema } from "../../common/types/event-type";

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
          ladderLevel: participant.ladder_level,
          groupRole: participant.group_role,
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

    eventsHandler.on(
      "REMOVE_PARTICIPANT_FROM_CONVERSATION",
      handleRemoveConversation
    );

    return () => {
      eventsHandler.off(
        "REMOVE_PARTICIPANT_FROM_CONVERSATION",
        handleRemoveConversation
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
